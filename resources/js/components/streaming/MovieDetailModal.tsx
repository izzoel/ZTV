import { useState, useEffect } from 'react';
import {
    Play,
    Plus,
    Check,
    X,
    Star,
    Film,
    Clock,
    RefreshCw,
    Layers,
    ChevronDown,
} from 'lucide-react';
import { MediaItem, Episode } from '@/data/movies';
import {
    fetchTmdbCredits,
    fetchTmdbEpisodes,
    fetchTmdbTvSeasons,
    translateText,
    isEngText,
} from '@/lib/tmdbService';
import { useLanguage } from '@/lib/i18n';

interface MovieDetailModalProps {
    item: MediaItem | null;
    onClose: () => void;
    onPlay: (
        item: MediaItem,
        episodeNumber?: number,
        seasonNumber?: number,
    ) => void;
    isSaved: boolean;
    onToggleMyList: (id: string) => void;
}

export default function MovieDetailModal({
    item,
    onClose,
    onPlay,
    isSaved,
    onToggleMyList,
}: MovieDetailModalProps) {
    const { language, t } = useLanguage();
    const [castList, setCastList] = useState<string[]>(item?.cast || []);
    const [directorName, setDirectorName] = useState<string>(
        item?.director || '',
    );
    const [isLoadingCredits, setIsLoadingCredits] = useState<boolean>(false);
    const [episodesList, setEpisodesList] = useState<Episode[]>(
        item?.episodes || [],
    );
    const [seasonsList, setSeasonsList] = useState<
        { seasonNumber: number; name: string; episodeCount: number }[]
    >([]);
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);

    // Synopsis translation state
    const [synopsisLang, setSynopsisLang] = useState<'id' | 'en'>(
        language === 'en' ? 'en' : 'id',
    );
    const [translatedSynopsis, setTranslatedSynopsis] = useState<{
        id?: string;
        en?: string;
    }>({});
    const [isTranslatingSynopsis, setIsTranslatingSynopsis] =
        useState<boolean>(false);

    useEffect(() => {
        setSynopsisLang(language === 'en' ? 'en' : 'id');
    }, [language]);

    const handleSwitchSynopsisLang = async (targetLang: 'id' | 'en') => {
        setSynopsisLang(targetLang);
        if (!item) return;

        if (targetLang === 'id') {
            if (!translatedSynopsis.id) {
                const currentEn =
                    item.synopsisEn ||
                    (isEngText(item.synopsis) ? item.synopsis : '');
                if (item.synopsis && !isEngText(item.synopsis)) return;
                if (currentEn) {
                    setIsTranslatingSynopsis(true);
                    try {
                        const res = await translateText(currentEn, 'en', 'id');
                        if (res)
                            setTranslatedSynopsis((prev) => ({
                                ...prev,
                                id: res,
                            }));
                    } finally {
                        setIsTranslatingSynopsis(false);
                    }
                }
            }
        } else {
            if (!translatedSynopsis.en) {
                if (item.synopsisEn && isEngText(item.synopsisEn)) return;
                if (item.synopsis && isEngText(item.synopsis)) return;
                const currentId = item.synopsis;
                if (currentId) {
                    setIsTranslatingSynopsis(true);
                    try {
                        const res = await translateText(currentId, 'id', 'en');
                        if (res)
                            setTranslatedSynopsis((prev) => ({
                                ...prev,
                                en: res,
                            }));
                    } finally {
                        setIsTranslatingSynopsis(false);
                    }
                }
            }
        }
    };

    const getDisplayedSynopsis = () => {
        if (!item) return '';
        if (synopsisLang === 'id') {
            if (translatedSynopsis.id) return translatedSynopsis.id;
            if (item.synopsis && !isEngText(item.synopsis))
                return item.synopsis;
            return item.synopsis;
        } else {
            if (translatedSynopsis.en) return translatedSynopsis.en;
            if (item.synopsisEn) return item.synopsisEn;
            if (item.synopsis && isEngText(item.synopsis)) return item.synopsis;
            return item.synopsisEn || item.synopsis;
        }
    };

    // Keyboard ESC shortcut to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Dynamic Live Credits, Seasons & Episodes Fetch from TMDB API
    useEffect(() => {
        if (!item) return;

        setCastList(item.cast && item.cast.length > 0 ? item.cast : []);
        setDirectorName(item.director || '');
        setEpisodesList(item.episodes || []);
        setSelectedSeasonNumber(1);

        if (item.tmdbId) {
            setIsLoadingCredits(true);
            fetchTmdbCredits(item.tmdbId, item.type).then((res) => {
                if (res.cast && res.cast.length > 0) {
                    setCastList(res.cast);
                }
                if (res.director) {
                    setDirectorName(res.director);
                }
                setIsLoadingCredits(false);
            });

            if (item.type === 'series') {
                fetchTmdbTvSeasons(item.tmdbId).then((seasons) => {
                    setSeasonsList(seasons);
                });
            }
        }
    }, [item]);

    // Fetch episodes whenever selectedSeasonNumber or item changes
    useEffect(() => {
        if (item && item.type === 'series' && item.tmdbId) {
            setIsLoadingEpisodes(true);
            fetchTmdbEpisodes(item.tmdbId, selectedSeasonNumber).then((eps) => {
                setEpisodesList(eps);
                setIsLoadingEpisodes(false);
            });
        }
    }, [item, selectedSeasonNumber]);

    if (!item) return null;

    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            className="fixed inset-0 z-50 flex animate-in cursor-pointer items-center justify-center overflow-y-auto bg-black/85 p-2 backdrop-blur-xl duration-200 fade-in sm:p-6"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative my-auto flex max-h-[92vh] w-full max-w-4xl cursor-default flex-col overflow-y-auto rounded-2xl border border-white/15 bg-slate-950 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
            >
                {/* Header Floating Close Button */}
                <button
                    onClick={onClose}
                    className="group absolute top-3 right-3 z-40 flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-slate-950/85 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all hover:bg-red-600 hover:text-white active:scale-95 sm:top-4 sm:right-4 sm:text-sm"
                    title="Tutup Modal (Esc)"
                    aria-label="Tutup Modal"
                >
                    <X className="h-4 w-4 text-slate-300 transition group-hover:text-white" />
                    <span>{t('close_modal')}</span>
                </button>

                {/* Hero Header Banner */}
                <div className="relative h-64 w-full shrink-0 overflow-hidden sm:h-96">
                    <img
                        src={item.backdropUrl}
                        alt={item.title}
                        className="h-full w-full object-cover brightness-90 filter"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

                    <div className="absolute right-4 bottom-4 left-4 space-y-2.5 sm:right-6 sm:bottom-6 sm:left-6 sm:space-y-3">
                        <h2 className="text-2xl leading-tight font-black tracking-tight text-white uppercase drop-shadow-lg sm:text-4xl">
                            {item.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300 sm:gap-3 sm:text-sm">
                            <span className="font-bold text-emerald-400">
                                {item.matchScore}
                            </span>
                            <span className="rounded border border-white/20 px-1.5 py-0.5 text-xs">
                                {item.ageRating}
                            </span>
                            <span>{item.year}</span>
                            <span>{item.duration}</span>
                            <span className="flex items-center gap-1 text-amber-400">
                                <Star className="h-3.5 w-3.5 fill-amber-400" />
                                {item.rating}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-stretch gap-2.5 pt-2 sm:flex-row sm:items-center sm:gap-3">
                            <button
                                onClick={() => {
                                    onClose();
                                    onPlay(item);
                                }}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/40 transition hover:bg-red-500 active:scale-95 sm:w-auto"
                            >
                                <Play className="h-4 w-4 fill-white" />
                                {t('play_movie')}
                            </button>

                            <button
                                onClick={() => onToggleMyList(item.id)}
                                className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold backdrop-blur-md transition active:scale-95 sm:w-auto ${
                                    isSaved
                                        ? 'border-emerald-500 bg-emerald-600/30 text-emerald-300'
                                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                {isSaved ? (
                                    <Check className="h-4 w-4 text-emerald-400" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                {isSaved ? t('hero_saved') : t('hero_my_list')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 space-y-6 p-4 text-slate-300 sm:space-y-8 sm:p-8">
                    {/* Synopsis & Cast */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                        <div className="space-y-2.5 sm:space-y-3 md:col-span-2">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-base font-bold text-white sm:text-lg">
                                    {t('synopsis_title')}
                                </h3>
                                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSwitchSynopsisLang('id')
                                        }
                                        disabled={isTranslatingSynopsis}
                                        title="Bahasa Indonesia"
                                        className={`rounded px-2 py-0.5 text-[11px] font-bold transition-all ${
                                            synopsisLang === 'id'
                                                ? 'bg-red-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        ID
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSwitchSynopsisLang('en')
                                        }
                                        disabled={isTranslatingSynopsis}
                                        title="English"
                                        className={`rounded px-2 py-0.5 text-[11px] font-bold transition-all ${
                                            synopsisLang === 'en'
                                                ? 'bg-red-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        ENG
                                    </button>
                                </div>
                            </div>
                            {isTranslatingSynopsis ? (
                                <p className="animate-pulse text-xs text-slate-400 italic">
                                    {synopsisLang === 'id'
                                        ? 'Menerjemahkan sinopsis...'
                                        : 'Translating synopsis...'}
                                </p>
                            ) : (
                                <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                                    {getDisplayedSynopsis()}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2.5 rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 text-xs sm:p-4">
                            <div>
                                <span className="mb-0.5 block font-semibold text-slate-400">
                                    {t('cast_title')}:
                                </span>
                                <span className="font-medium text-white">
                                    {isLoadingCredits &&
                                    castList.length === 0 ? (
                                        <span className="text-slate-500 italic">
                                            {language === 'en'
                                                ? 'Loading cast...'
                                                : 'Memuat pemeran...'}
                                        </span>
                                    ) : castList.length > 0 ? (
                                        castList.join(', ')
                                    ) : (
                                        'TMDB Lead Cast'
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="mb-0.5 block font-semibold text-slate-400">
                                    {t('director_title')}:
                                </span>
                                <span className="font-medium text-white">
                                    {isLoadingCredits && !directorName ? (
                                        <span className="text-slate-500 italic">
                                            {language === 'en'
                                                ? 'Loading director...'
                                                : 'Memuat sutradara...'}
                                        </span>
                                    ) : directorName ? (
                                        directorName
                                    ) : (
                                        'Director'
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="mb-0.5 block font-semibold text-slate-400">
                                    {t('genre_title')}:
                                </span>
                                <span className="font-semibold text-red-400">
                                    {item.genres.join(', ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Episodes List (if series) */}
                    {item.type === 'series' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-start justify-between gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center">
                                <h3 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
                                    <Film className="h-5 w-5 text-red-500" />
                                    {t('episodes_title')}
                                </h3>

                                {/* Dynamic Season Dropdown */}
                                {seasonsList.length > 0 && (
                                    <div className="relative inline-block min-w-[150px]">
                                        <select
                                            value={selectedSeasonNumber}
                                            onChange={(e) =>
                                                setSelectedSeasonNumber(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full cursor-pointer appearance-none rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2 pr-8 text-xs font-bold text-white transition hover:border-red-500/50 hover:bg-slate-900 focus:ring-2 focus:ring-red-500/50 focus:outline-none"
                                        >
                                            {seasonsList.map((s) => (
                                                <option
                                                    key={s.seasonNumber}
                                                    value={s.seasonNumber}
                                                    className="bg-slate-900 font-semibold text-white"
                                                >
                                                    {s.name ||
                                                        `Musim ${s.seasonNumber}`}{' '}
                                                    {s.episodeCount
                                                        ? `(${s.episodeCount} Episode)`
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                )}
                            </div>

                            {isLoadingEpisodes && episodesList.length === 0 ? (
                                <div className="flex items-center justify-center gap-2 py-8 text-center text-xs text-slate-400">
                                    <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
                                    <span>
                                        Memuat episode Musim{' '}
                                        {selectedSeasonNumber} dari TMDB API...
                                    </span>
                                </div>
                            ) : episodesList.length > 0 ? (
                                <div className="custom-episode-scrollbar max-h-[320px] space-y-2.5 overflow-y-auto pr-1.5 sm:max-h-[380px]">
                                    {episodesList.map((ep) => (
                                        <div
                                            key={ep.id}
                                            onClick={() => {
                                                onClose();
                                                onPlay(
                                                    item,
                                                    ep.episodeNumber,
                                                    selectedSeasonNumber,
                                                );
                                            }}
                                            className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-slate-900/70 p-2.5 transition hover:border-red-500/40 hover:bg-slate-900"
                                        >
                                            <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg border border-white/5 bg-slate-950 sm:w-32">
                                                <img
                                                    src={ep.thumbnail}
                                                    alt={ep.title}
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition group-hover:bg-red-600/30">
                                                    <Play className="h-5 w-5 fill-white text-white opacity-90 transition group-hover:scale-110" />
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="truncate text-xs font-bold text-white transition group-hover:text-red-400 sm:text-sm">
                                                        {ep.title}
                                                    </h4>
                                                    <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-slate-400">
                                                        <Clock className="h-3 w-3 text-slate-500" />
                                                        {ep.duration}
                                                    </span>
                                                </div>
                                                <p className="line-clamp-1 text-[11px] leading-relaxed text-slate-400 sm:text-xs">
                                                    {ep.synopsis}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-xs text-slate-500 italic">
                                    Daftar episode tidak tersedia saat ini.
                                </p>
                            )}

                            {/* Inline CSS for episode list scrollbar */}
                            <style>{`
                                .custom-episode-scrollbar::-webkit-scrollbar {
                                    width: 5px;
                                }
                                .custom-episode-scrollbar::-webkit-scrollbar-track {
                                    background: rgba(15, 23, 42, 0.6);
                                    border-radius: 9999px;
                                }
                                .custom-episode-scrollbar::-webkit-scrollbar-thumb {
                                    background: rgba(239, 68, 68, 0.5);
                                    border-radius: 9999px;
                                }
                                .custom-episode-scrollbar::-webkit-scrollbar-thumb:hover {
                                    background: rgba(239, 68, 68, 0.9);
                                }
                            `}</style>
                        </div>
                    )}

                    {/* Bottom Close Button for Mobile View */}
                    <div className="border-t border-white/10 pt-4 sm:hidden">
                        <button
                            onClick={onClose}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-900 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-red-600 active:scale-95"
                        >
                            <X className="h-4 w-4" />
                            <span>Tutup Detail Film</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
