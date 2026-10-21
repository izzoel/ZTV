import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/data/movies';
import MovieCard from './MovieCard';

interface MovieRowProps {
    title: string;
    items: MediaItem[];
    onPlay: (item: MediaItem) => void;
    onOpenDetail: (item: MediaItem) => void;
    myList: string[];
    onToggleMyList: (id: string) => void;
    showProgress?: boolean;
    badge?: string;
}

export default function MovieRow({
    title,
    items,
    onPlay,
    onOpenDetail,
    myList,
    onToggleMyList,
    showProgress = false,
    badge,
}: MovieRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);

    const handleScroll = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollAmount = clientWidth * 0.75;
            rowRef.current.scrollTo({
                left:
                    direction === 'left'
                        ? scrollLeft - scrollAmount
                        : scrollLeft + scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (items.length === 0) return null;

    return (
        <section className="group/row relative mx-auto my-8 max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                        {title}
                    </h2>
                    {badge && (
                        <span className="rounded-full border border-red-500/30 bg-red-600/20 px-2.5 py-0.5 text-xs font-semibold text-red-400 uppercase">
                            {badge}
                        </span>
                    )}
                </div>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Left Arrow */}
                <button
                    onClick={() => handleScroll('left')}
                    className="absolute top-1/2 left-0 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-2xl border border-l-0 border-white/20 bg-slate-950/80 text-white opacity-0 shadow-xl backdrop-blur-md transition-all duration-300 group-hover/row:opacity-100 hover:bg-red-600"
                    aria-label="Previous"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => handleScroll('right')}
                    className="absolute top-1/2 right-0 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-l-2xl border border-r-0 border-white/20 bg-slate-950/80 text-white opacity-0 shadow-xl backdrop-blur-md transition-all duration-300 group-hover/row:opacity-100 hover:bg-red-600"
                    aria-label="Next"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>

                {/* Cards Scroll */}
                <div
                    ref={rowRef}
                    className="no-scrollbar flex items-center gap-4 overflow-x-auto scroll-smooth px-1 py-4"
                >
                    {items.map((item) => (
                        <MovieCard
                            key={item.id}
                            item={item}
                            onPlay={onPlay}
                            onOpenDetail={onOpenDetail}
                            isSaved={myList.includes(item.id)}
                            onToggleMyList={onToggleMyList}
                            showProgress={showProgress}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
