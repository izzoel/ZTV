import { Play, Plus, Check, Star } from 'lucide-react';
import { MediaItem } from '@/data/movies';

interface MovieCardProps {
    item: MediaItem;
    onPlay: (item: MediaItem) => void;
    onOpenDetail: (item: MediaItem) => void;
    isSaved: boolean;
    onToggleMyList: (id: string) => void;
    showProgress?: boolean;
}

export default function MovieCard({
    item,
    onPlay,
    onOpenDetail,
    isSaved,
    onToggleMyList,
    showProgress = false,
}: MovieCardProps) {
    return (
        <div
            onClick={() => onOpenDetail(item)}
            className="group relative w-48 flex-none cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl transition-all duration-300 hover:z-30 hover:scale-105 hover:shadow-2xl hover:shadow-red-950/50 sm:w-56 md:w-64"
        >
            {/* Poster Thumbnail */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Top Badges */}
                <div className="pointer-events-none absolute top-2 right-2 left-2 flex items-center justify-between gap-1">
                    <span className="ml-auto flex items-center gap-0.5 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-md">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        {item.rating}
                    </span>
                </div>

                {/* Progress bar for continue watching */}
                {showProgress && item.progress !== undefined && (
                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-slate-800">
                        <div
                            className="h-full rounded-r bg-gradient-to-r from-red-600 to-rose-500"
                            style={{ width: `${item.progress}%` }}
                        />
                    </div>
                )}

                {/* Hover Play Gradient Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="mb-2 flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlay(item);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/50 transition hover:scale-110 hover:bg-red-500 active:scale-95"
                            title="Putar Film"
                        >
                            <Play className="ml-0.5 h-5 w-5 fill-white" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleMyList(item.id);
                            }}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition ${
                                isSaved
                                    ? 'border-emerald-400 bg-emerald-600/80 text-white'
                                    : 'border-white/30 bg-white/20 text-white hover:bg-white/40'
                            }`}
                            title={
                                isSaved
                                    ? 'Hapus dari Daftar'
                                    : 'Tambah ke Daftar'
                            }
                        >
                            {isSaved ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    <h3 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-red-400">
                        {item.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-300">
                        <span className="font-semibold text-emerald-400">
                            {item.matchScore}
                        </span>
                        <span>•</span>
                        <span>{item.ageRating}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-slate-400">
                        {item.genres.slice(0, 2).join(' • ')}
                    </div>
                </div>
            </div>

            {/* Static Bottom Label for non-hover state */}
            <div className="bg-slate-900 p-3 transition-colors group-hover:bg-slate-950">
                <h4 className="truncate text-xs font-semibold text-white">
                    {item.title}
                </h4>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{item.year}</span>
                    <span className="font-medium text-slate-300">
                        {item.duration}
                    </span>
                </div>
            </div>
        </div>
    );
}
