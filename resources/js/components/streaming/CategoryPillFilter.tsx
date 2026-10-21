import {
    Film,
    Tv,
    Flame,
    Heart,
    Zap,
    Ghost,
    Smile,
    Compass,
    Layers,
} from 'lucide-react';
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
    onSelectGenre,
}: CategoryPillFilterProps) {
    const getGenreIcon = (genre: string) => {
        switch (genre) {
            case 'Semua':
                return <Layers className="h-3.5 w-3.5" />;
            case 'Aksi & Sci-Fi':
                return <Zap className="h-3.5 w-3.5 text-cyan-400" />;
            case 'Horor & Misteri':
                return <Ghost className="h-3.5 w-3.5 text-purple-400" />;
            case 'Drama Indonesia':
                return <Heart className="h-3.5 w-3.5 text-rose-400" />;
            case 'Anime':
                return <Film className="h-3.5 w-3.5 text-pink-400" />;
            case 'Komedi':
                return <Smile className="h-3.5 w-3.5 text-amber-400" />;
            case 'Petualangan':
                return <Compass className="h-3.5 w-3.5 text-emerald-400" />;
            default:
                return null;
        }
    };

    return (
        <div className="mx-auto my-6 max-w-7xl space-y-3 px-4 sm:px-6 lg:px-8">
            {/* Main Categories Row (Film, Series TV, Semua, ZTV Originals) */}
            {onSelectCategory && (
                <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                    {MAIN_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isCatActive =
                            activeCategory === cat.id ||
                            (cat.id === 'Series TV' &&
                                (activeCategory === 'Serial TV' ||
                                    activeCategory === 'TV Series'));

                        return (
                            <button
                                key={cat.id}
                                onClick={() => onSelectCategory(cat.id)}
                                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold shadow-sm transition-all duration-200 sm:text-sm ${
                                    isCatActive
                                        ? 'scale-105 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg ring-2 shadow-red-600/30 ring-red-500/50'
                                        : 'border border-white/10 bg-slate-900/90 text-slate-300 hover:border-white/20 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <Icon
                                    className={`h-4 w-4 ${isCatActive ? 'text-white' : 'text-slate-400'}`}
                                />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Genre Pills Row */}
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-1 py-1">
                {GENRES.map((genre) => {
                    const isGenreActive = activeGenre === genre;
                    return (
                        <button
                            key={genre}
                            onClick={() => onSelectGenre(genre)}
                            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                isGenreActive
                                    ? 'scale-105 bg-white font-bold text-slate-950 shadow-md'
                                    : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {getGenreIcon(genre)}
                            <span>
                                {genre === 'Semua' ? 'Semua Genre' : genre}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
