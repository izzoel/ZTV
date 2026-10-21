import { useState, useEffect, useRef } from 'react';
import {
    Play,
    Plus,
    Check,
    Info,
    Star,
    Sparkles,
    ChevronRight,
    ShieldCheck,
} from 'lucide-react';
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
    onToggleMyList,
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
            className="relative h-[85vh] max-h-[820px] min-h-[580px] w-full touch-pan-y overflow-hidden bg-slate-950 select-none"
        >
            {/* Background Image / Video Backdrop */}
            <div className="absolute inset-0 z-0">
                <img
                    src={currentItem.backdropUrl}
                    alt={currentItem.title}
                    className="h-full w-full scale-105 animate-pulse object-cover object-center brightness-90 filter transition-all duration-1000 duration-[10000ms]"
                />

                {/* Gradient Masks for Cinematic Depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/80 to-transparent" />

                {/* Subtle Ambient Glow Effect */}
                <div className="pointer-events-none absolute bottom-1/4 left-10 h-96 w-96 rounded-full bg-red-600/20 blur-[120px]" />
            </div>

            {/* Hero Content Container */}
            <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pt-28 pb-16 sm:px-6 lg:px-8">
                <div className="max-w-2xl space-y-4">
                    {/* Badge Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 rounded border border-white/20 bg-black/40 px-2.5 py-0.5 text-xs font-semibold text-amber-400 backdrop-blur-md">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            IMDb {currentItem.rating}
                        </span>
                        <span className="rounded border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                            {currentItem.matchScore}
                        </span>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
                            {currentItem.ageRating}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl leading-tight font-black tracking-tight text-white uppercase drop-shadow-2xl sm:text-5xl sm:leading-none lg:text-6xl">
                        {currentItem.title}
                    </h1>

                    {/* Genre list & metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300 sm:gap-3 sm:text-sm">
                        <span>{currentItem.year}</span>
                        <span>•</span>
                        <span>{currentItem.duration}</span>
                        <span>•</span>
                        <span className="font-semibold text-red-400">
                            {currentItem.genres.join(', ')}
                        </span>
                    </div>

                    {/* Synopsis */}
                    <p className="line-clamp-2 max-w-xl text-xs leading-relaxed text-slate-300 drop-shadow sm:line-clamp-3 sm:text-base">
                        {language === 'en' && currentItem.synopsisEn
                            ? currentItem.synopsisEn
                            : currentItem.synopsis}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 sm:gap-3 sm:pt-2">
                        <button
                            onClick={() => onPlay(currentItem)}
                            className="flex min-w-[120px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-red-600/30 transition-all duration-200 hover:scale-105 hover:bg-red-500 active:scale-95 sm:flex-none sm:gap-2 sm:rounded-2xl sm:px-6 sm:py-3 sm:text-base"
                        >
                            <Play className="h-4 w-4 fill-white sm:h-5 sm:w-5" />
                            <span>{t('hero_play')}</span>
                        </button>

                        <button
                            onClick={() => onToggleMyList(currentItem.id)}
                            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold backdrop-blur-md transition-all duration-200 sm:flex-none sm:gap-2 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm ${
                                isSaved
                                    ? 'border-emerald-500/50 bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40'
                                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            {isSaved ? (
                                <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            <span>
                                {isSaved ? t('hero_saved') : t('hero_my_list')}
                            </span>
                        </button>

                        <button
                            onClick={() => onOpenDetail(currentItem)}
                            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all hover:bg-slate-800 sm:w-auto sm:gap-2 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
                        >
                            <Info className="h-4 w-4 text-cyan-400" />
                            <span>{t('hero_more_info')}</span>
                        </button>
                    </div>
                </div>

                {/* Right Bottom Controls (Carousel Indicator) */}
                <div className="absolute right-4 bottom-3 z-20 flex items-center gap-2 sm:right-8 sm:bottom-12 sm:gap-4">
                    {/* Pagination Indicators */}
                    <div className="flex items-center gap-1 rounded-full border border-white/15 bg-slate-950/80 p-1.5 shadow-lg backdrop-blur-md sm:gap-1.5 sm:p-2">
                        {items.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-1.5 cursor-pointer rounded-full transition-all sm:h-2 ${
                                    idx === currentIndex
                                        ? 'w-5 bg-red-600 shadow-sm shadow-red-600/50 sm:w-6'
                                        : 'w-1.5 bg-white/30 hover:bg-white/60 sm:w-2'
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
