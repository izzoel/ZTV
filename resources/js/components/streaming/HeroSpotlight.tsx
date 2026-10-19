import { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, Info, Star, Sparkles, ChevronRight, ShieldCheck } from 'lucide-react';
import { MediaItem } from '@/data/movies';
import { useLanguage } from '@/lib/i18n';

interface HeroSpotlightProps {
    items: MediaItem[];
    onPlay: (item: MediaItem) => void;
    onOpenDetail: (item: MediaItem) => void;
    myList: string[];
    onToggleMyList: (id: string) => void;
}

export default function HeroSpotlight({
    items,
    onPlay,
    onOpenDetail,
    myList,
    onToggleMyList
}: HeroSpotlightProps) {
    const { language, t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const currentItem = items[currentIndex] || items[0];
    const isSaved = myList.includes(currentItem.id);

    // Auto-advance slide every 8 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [items.length]);

    // Touch Swipe Gesture Handlers for Mobile View
    const handleTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;
        const distance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 40;

        if (distance > minSwipeDistance) {
            // Swipe Left -> Next Slide
            setCurrentIndex((prev) => (prev + 1) % items.length);
        } else if (distance < -minSwipeDistance) {
            // Swipe Right -> Prev Slide
            setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
        }
    };

    if (!currentItem) return null;

    return (
        <section 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative w-full h-[85vh] min-h-[580px] max-h-[820px] overflow-hidden bg-slate-950 select-none touch-pan-y"
        >
            {/* Background Image / Video Backdrop */}
            <div className="absolute inset-0 z-0">
                <img
                    src={currentItem.backdropUrl}
                    alt={currentItem.title}
                    className="w-full h-full object-cover object-center scale-105 animate-pulse duration-[10000ms] filter brightness-90 transition-all duration-1000"
                />

                {/* Gradient Masks for Cinematic Depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-slate-950/80 to-transparent" />

                {/* Subtle Ambient Glow Effect */}
                <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
            </div>

            {/* Hero Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 pt-28">
                <div className="max-w-2xl space-y-4">
                    {/* Badge Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded border border-white/20 bg-black/40 text-amber-400 text-xs font-semibold backdrop-blur-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            IMDb {currentItem.rating}
                        </span>
                        <span className="px-2.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/50 text-emerald-400 text-xs font-semibold">
                            {currentItem.matchScore}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
                            {currentItem.ageRating}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-2xl leading-tight sm:leading-none uppercase">
                        {currentItem.title}
                    </h1>

                    {/* Genre list & metadata */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-300 font-medium">
                        <span>{currentItem.year}</span>
                        <span>•</span>
                        <span>{currentItem.duration}</span>
                        <span>•</span>
                        <span className="text-red-400 font-semibold">{currentItem.genres.join(', ')}</span>
                    </div>

                    {/* Synopsis */}
                    <p className="text-xs sm:text-base text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-xl">
                        {language === 'en' && currentItem.synopsisEn ? currentItem.synopsisEn : currentItem.synopsis}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                        <button
                            onClick={() => onPlay(currentItem)}
                            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex-1 sm:flex-none min-w-[120px]"
                        >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                            <span>{t('hero_play')}</span>
                        </button>

                        <button
                            onClick={() => onToggleMyList(currentItem.id)}
                            className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 backdrop-blur-md transition-all duration-200 border cursor-pointer flex-1 sm:flex-none ${
                                isSaved
                                    ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40'
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            }`}
                        >
                            {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                            <span>{isSaved ? t('hero_saved') : t('hero_my_list')}</span>
                        </button>

                        <button
                            onClick={() => onOpenDetail(currentItem)}
                            className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-white/10 hover:bg-slate-800 text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 backdrop-blur-md transition-all cursor-pointer w-full sm:w-auto"
                        >
                            <Info className="w-4 h-4 text-cyan-400" />
                            <span>{t('hero_more_info')}</span>
                        </button>
                    </div>
                </div>

                {/* Right Bottom Controls (Carousel Indicator) */}
                <div className="absolute bottom-3 right-4 sm:bottom-12 sm:right-8 z-20 flex items-center gap-2 sm:gap-4">
                    {/* Pagination Indicators */}
                    <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 p-1.5 sm:p-2 rounded-full border border-white/15 backdrop-blur-md shadow-lg">
                        {items.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                                    idx === currentIndex ? 'w-5 sm:w-6 bg-red-600 shadow-sm shadow-red-600/50' : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/60'
                                }`}
                                title={item.title}
                                aria-label={`Slide ${idx + 1}: ${item.title}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
