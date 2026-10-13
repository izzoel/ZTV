import { Film, Tv, Flame, Heart, Zap, Ghost, Smile, Compass, Layers } from 'lucide-react';
import { GENRES } from '@/data/movies';

export const MAIN_CATEGORIES = [
    { id: 'Semua', label: 'Semua Konten', icon: Flame },
    { id: 'Film', label: 'Film', icon: Film },
    { id: 'Series TV', label: 'Series TV', icon: Tv },
];

interface CategoryPillFilterProps {
    activeCategory?: string;
    onSelectCategory?: (category: string) => void;
    activeGenre: string;
    onSelectGenre: (genre: string) => void;
}

export default function CategoryPillFilter({
    activeCategory = 'Semua',
    onSelectCategory,
    activeGenre,
    onSelectGenre
}: CategoryPillFilterProps) {
    const getGenreIcon = (genre: string) => {
        switch (genre) {
            case 'Semua':
                return <Layers className="w-3.5 h-3.5" />;
            case 'Aksi & Sci-Fi':
                return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
            case 'Horor & Misteri':
                return <Ghost className="w-3.5 h-3.5 text-purple-400" />;
            case 'Drama Indonesia':
                return <Heart className="w-3.5 h-3.5 text-rose-400" />;
            case 'Anime':
                return <Film className="w-3.5 h-3.5 text-pink-400" />;
            case 'Komedi':
                return <Smile className="w-3.5 h-3.5 text-amber-400" />;
            case 'Petualangan':
                return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 space-y-3">
            {/* Main Categories Row (Film, Series TV, Semua, ZTV Originals) */}
            {onSelectCategory && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {MAIN_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isCatActive =
                            activeCategory === cat.id ||
                            (cat.id === 'Series TV' && (activeCategory === 'Serial TV' || activeCategory === 'TV Series'));

                        return (
                            <button
                                key={cat.id}
                                onClick={() => onSelectCategory(cat.id)}
                                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold shrink-0 flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-sm ${
                                    isCatActive
                                        ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg shadow-red-600/30 scale-105 ring-2 ring-red-500/50'
                                        : 'bg-slate-900/90 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-white/20'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isCatActive ? 'text-white' : 'text-slate-400'}`} />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Genre Pills Row */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
                {GENRES.map((genre) => {
                    const isGenreActive = activeGenre === genre;
                    return (
                        <button
                            key={genre}
                            onClick={() => onSelectGenre(genre)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                                isGenreActive
                                    ? 'bg-white text-slate-950 font-bold shadow-md scale-105'
                                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {getGenreIcon(genre)}
                            <span>{genre === 'Semua' ? 'Semua Genre' : genre}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
