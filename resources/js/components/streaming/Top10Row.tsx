import { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
    onToggleMyList
}: Top10RowProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const top10 = items.filter((item) => item.top10Rank !== undefined).sort((a, b) => (a.top10Rank || 0) - (b.top10Rank || 0));

    // Scroll buttons check
    const checkScrollPosition = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
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

            if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 20) {
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
            behavior: 'smooth'
        });
    };

    if (top10.length === 0) return null;

    return (
        <section className="my-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto group/section relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-rose-600 rounded-full shadow-lg shadow-red-600/50 animate-pulse" />
                    <h2 className="text-lg sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                        Top 10 Hari Ini di Indonesia
                    </h2>
                </div>

                {/* Left / Right Scroll Navigation Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleScroll('left')}
                        disabled={!canScrollLeft}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-600 text-white border border-white/10 disabled:opacity-30 disabled:hover:bg-slate-900/80 transition cursor-pointer"
                        title="Scroll Kiri"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleScroll('right')}
                        disabled={!canScrollRight}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-600 text-white border border-white/10 disabled:opacity-30 disabled:hover:bg-slate-900/80 transition cursor-pointer"
                        title="Scroll Kanan"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Scrollable Container */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScrollPosition}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-6 pt-2 px-2 custom-top10-scrollbar scroll-smooth"
            >
                {top10.map((item, index) => {
                    const isSaved = myList.includes(item.id);
                    const rank = index + 1;

                    return (
                        <div
                            key={item.id}
                            className="group relative flex-none flex items-end w-64 sm:w-72 cursor-pointer select-none py-2"
                            onClick={() => onOpenDetail(item)}
                        >
                            {/* Huge Rank Number */}
                            <span className="font-black text-[120px] sm:text-[140px] leading-none tracking-tighter text-transparent stroke-text font-mono select-none -mr-8 z-0 transition-all duration-300 group-hover:scale-110 group-hover:-translate-x-1">
                                {rank}
                            </span>

                            {/* Card Poster Overlap */}
                            <div className="relative z-10 w-40 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-red-600/30 group-hover:border-red-500/40">
                                <img
                                    src={item.posterUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Overlay on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPlay(item);
                                            }}
                                            className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition transform hover:scale-105"
                                        >
                                            <Play className="w-4 h-4 fill-white ml-0.5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleMyList(item.id);
                                            }}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center border backdrop-blur-md transition transform hover:scale-105 ${
                                                isSaved ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-white/20 text-white border-white/20'
                                            }`}
                                        >
                                            {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                                    <span className="text-[10px] text-amber-400 font-semibold">
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
