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
    showProgress = false
}: MovieCardProps) {
    return (
        <div 
            onClick={() => onOpenDetail(item)}
            className="group relative flex-none w-48 sm:w-56 md:w-64 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl transition-all duration-300 hover:scale-105 hover:z-30 hover:shadow-2xl hover:shadow-red-950/50 cursor-pointer"
        >
            {/* Poster Thumbnail */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-slate-950/80 text-amber-400 text-[10px] font-bold backdrop-blur-md flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {item.rating}
                    </span>
                </div>

                {/* Progress bar for continue watching */}
                {showProgress && item.progress !== undefined && (
                    <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-800">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-r"
                            style={{ width: `${item.progress}%` }}
                        />
                    </div>
                )}

                {/* Hover Play Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlay(item);
                            }}
                            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/50 hover:scale-110 active:scale-95 transition"
                            title="Putar Film"
                        >
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleMyList(item.id);
                            }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md transition ${
                                isSaved
                                    ? 'bg-emerald-600/80 border-emerald-400 text-white'
                                    : 'bg-white/20 border-white/30 text-white hover:bg-white/40'
                            }`}
                            title={isSaved ? 'Hapus dari Daftar' : 'Tambah ke Daftar'}
                        >
                            {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                        {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1">
                        <span className="text-emerald-400 font-semibold">{item.matchScore}</span>
                        <span>•</span>
                        <span>{item.ageRating}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {item.genres.slice(0, 2).join(' • ')}
                    </div>
                </div>
            </div>

            {/* Static Bottom Label for non-hover state */}
            <div className="p-3 bg-slate-900 group-hover:bg-slate-950 transition-colors">
                <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{item.year}</span>
                    <span className="text-slate-300 font-medium">{item.duration}</span>
                </div>
            </div>
        </div>
    );
}
