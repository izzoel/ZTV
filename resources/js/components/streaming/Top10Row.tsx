import { useState, useEffect, useRef } from 'react';
import {
    Play,
    Plus,
    Check,
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { MediaItem } from '@/data/movies';

interface Top10RowProps {
    items: MediaItem[];
    onPlay: (item: MediaItem) => void;
    onOpenDetail: (item: MediaItem) => void;
    myList: string[];
    onToggleMyList: (id: string) => void;
}

export default function Top10Row({
    items,
    onPlay,
    onOpenDetail,
    myList,
    onToggleMyList,
}: Top10RowProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const top10 = items
        .filter((item) => item.top10Rank !== undefined)
        .sort((a, b) => (a.top10Rank || 0) - (b.top10Rank || 0));

    // Scroll buttons check
    const checkScrollPosition = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } =
            scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    // Auto-sliding animation interval (pauses on mouse hover)
    useEffect(() => {
        if (top10.length === 0 || isHovered) return;

        const interval = setInterval(() => {
            if (!scrollContainerRef.current) return;
            const container = scrollContainerRef.current;
            const scrollAmount = 300; // Approx card width + gap

            if (
                container.scrollLeft + container.clientWidth >=
                container.scrollWidth - 20
            ) {
                // Loop back smoothly to start
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }, 3500);

        return () => clearInterval(interval);
    }, [top10, isHovered]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 320;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    if (top10.length === 0) return null;

    return (
        <section className="group/section relative mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-2 animate-pulse rounded-full bg-gradient-to-b from-red-500 to-rose-600 shadow-lg shadow-red-600/50" />
                    <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-white sm:text-3xl">
                        Top 10 Hari Ini di Indonesia
                    </h2>
                </div>

                {/* Left / Right Scroll Navigation Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleScroll('left')}
                        disabled={!canScrollLeft}
                        className="cursor-pointer rounded-xl border border-white/10 bg-slate-900/80 p-2 text-white transition hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-slate-900/80"
                        title="Scroll Kiri"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => handleScroll('right')}
                        disabled={!canScrollRight}
                        className="cursor-pointer rounded-xl border border-white/10 bg-slate-900/80 p-2 text-white transition hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-slate-900/80"
                        title="Scroll Kanan"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Scrollable Container */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScrollPosition}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="custom-top10-scrollbar flex items-center gap-6 overflow-x-auto scroll-smooth px-2 pt-2 pb-6 sm:gap-8"
            >
                {top10.map((item, index) => {
                    const isSaved = myList.includes(item.id);
                    const rank = index + 1;

                    return (
                        <div
                            key={item.id}
                            className="group relative flex w-64 flex-none cursor-pointer items-end py-2 select-none sm:w-72"
                            onClick={() => onOpenDetail(item)}
                        >
                            {/* Huge Rank Number */}
                            <span className="stroke-text z-0 -mr-8 font-mono text-[120px] leading-none font-black tracking-tighter text-transparent transition-all duration-300 select-none group-hover:-translate-x-1 group-hover:scale-110 sm:text-[140px]">
                                {rank}
                            </span>

                            {/* Card Poster Overlap */}
                            <div className="relative z-10 aspect-[2/3] w-40 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:border-red-500/40 group-hover:shadow-red-600/30 sm:w-48">
                                <img
                                    src={item.posterUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Overlay on Hover */}
                                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                    <div className="mb-2 flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPlay(item);
                                            }}
                                            className="flex h-9 w-9 transform items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-105 hover:bg-red-500"
                                        >
                                            <Play className="ml-0.5 h-4 w-4 fill-white" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleMyList(item.id);
                                            }}
                                            className={`flex h-8 w-8 transform items-center justify-center rounded-full border backdrop-blur-md transition hover:scale-105 ${
                                                isSaved
                                                    ? 'border-emerald-400 bg-emerald-600 text-white'
                                                    : 'border-white/20 bg-white/20 text-white'
                                            }`}
                                        >
                                            {isSaved ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Plus className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <h4 className="truncate text-xs font-bold text-white">
                                        {item.title}
                                    </h4>
                                    <span className="text-[10px] font-semibold text-amber-400">
                                        ★ {item.rating} • {item.genres[0]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Custom Styling for Stroked Numbers & Beautiful Red Glow Scrollbar */}
            <style>{`
                .stroke-text {
                    -webkit-text-stroke: 4px rgba(255, 255, 255, 0.25);
                }
                .group:hover .stroke-text {
                    -webkit-text-stroke: 4px rgba(239, 68, 68, 0.9);
                    filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.4));
                }

                /* Custom Ultra-Sleek Scrollbar */
                .custom-top10-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-top10-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.6);
                    border-radius: 9999px;
                    margin-left: 8px;
                    margin-right: 8px;
                }
                .custom-top10-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(90deg, #ef4444, #f43f5e);
                    border-radius: 9999px;
                    box-shadow: 0 0 12px rgba(239, 68, 68, 0.8);
                }
                .custom-top10-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(90deg, #dc2626, #e11d48);
                }
            `}</style>
        </section>
    );
}
