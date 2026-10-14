import { useState, useEffect } from 'react';
import { Play, Plus, Check, X, Star, Film, Clock, RefreshCw, Layers, ChevronDown } from 'lucide-react';
import { MediaItem, Episode } from '@/data/movies';
import { fetchTmdbCredits, fetchTmdbEpisodes, fetchTmdbTvSeasons, translateText, isEngText } from '@/lib/tmdbService';
import { useLanguage } from '@/lib/i18n';

interface MovieDetailModalProps {
    item: MediaItem | null;
    onClose: () => void;
    onPlay: (item: MediaItem, episodeNumber?: number, seasonNumber?: number) => void;
    isSaved: boolean;
    onToggleMyList: (id: string) => void;
}

export default function MovieDetailModal({
    item,
    onClose,
    onPlay,
    isSaved,
    onToggleMyList
}: MovieDetailModalProps) {
    const { language, t } = useLanguage();
    const [castList, setCastList] = useState<string[]>(item?.cast || []);
    const [directorName, setDirectorName] = useState<string>(item?.director || '');
    const [isLoadingCredits, setIsLoadingCredits] = useState<boolean>(false);
    const [episodesList, setEpisodesList] = useState<Episode[]>(item?.episodes || []);
    const [seasonsList, setSeasonsList] = useState<{ seasonNumber: number; name: string; episodeCount: number }[]>([]);
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);

    // Synopsis translation state
    const [synopsisLang, setSynopsisLang] = useState<'id' | 'en'>(language === 'en' ? 'en' : 'id');
    const [translatedSynopsis, setTranslatedSynopsis] = useState<{ id?: string; en?: string }>({});
    const [isTranslatingSynopsis, setIsTranslatingSynopsis] = useState<boolean>(false);

    useEffect(() => {
        setSynopsisLang(language === 'en' ? 'en' : 'id');
    }, [language]);

    const handleSwitchSynopsisLang = async (targetLang: 'id' | 'en') => {
        setSynopsisLang(targetLang);
        if (!item) return;

        if (targetLang === 'id') {
            if (!translatedSynopsis.id) {
                const currentEn = item.synopsisEn || (isEngText(item.synopsis) ? item.synopsis : '');
                if (item.synopsis && !isEngText(item.synopsis)) return;
                if (currentEn) {
                    setIsTranslatingSynopsis(true);
                    try {
                        const res = await translateText(currentEn, 'en', 'id');
                        if (res) setTranslatedSynopsis((prev) => ({ ...prev, id: res }));
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
                        if (res) setTranslatedSynopsis((prev) => ({ ...prev, en: res }));
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
            if (item.synopsis && !isEngText(item.synopsis)) return item.synopsis;
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
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-slate-950 border border-white/15 rounded-2xl sm:rounded-3xl overflow-y-auto shadow-2xl my-auto cursor-default flex flex-col"
            >
                {/* Header Floating Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 px-3.5 py-2 rounded-xl bg-slate-950/85 hover:bg-red-600 border border-white/20 text-white hover:text-white transition-all shadow-xl cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-bold backdrop-blur-md active:scale-95 group"
                    title="Tutup Modal (Esc)"
                    aria-label="Tutup Modal"
                >
                    <X className="w-4 h-4 text-slate-300 group-hover:text-white transition" />
                    <span>{t('close_modal')}</span>
                </button>

                {/* Hero Header Banner */}
                <div className="relative w-full h-64 sm:h-96 overflow-hidden shrink-0">
                    <img
                        src={item.backdropUrl}
                        alt={item.title}
                        className="w-full h-full object-cover filter brightness-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 space-y-2.5 sm:space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
                                {item.quality}
                            </span>
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight drop-shadow-lg leading-tight">
                            {item.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-300 font-medium">
                            <span className="text-emerald-400 font-bold">{item.matchScore}</span>
                            <span className="px-1.5 py-0.5 rounded border border-white/20 text-xs">{item.ageRating}</span>
                            <span>{item.year}</span>
                            <span>{item.duration}</span>
                            <span className="text-amber-400 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                {item.rating}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
                            <button
                                onClick={() => {
                                    onClose();
                                    onPlay(item);
                                }}
                                className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/40 transition active:scale-95 cursor-pointer w-full sm:w-auto"
                            >
                                <Play className="w-4 h-4 fill-white" />
                                {t('play_movie')}
                            </button>

                            <button
                                onClick={() => onToggleMyList(item.id)}
                                className={`px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border backdrop-blur-md transition active:scale-95 cursor-pointer w-full sm:w-auto ${
                                    isSaved
                                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                }`}
                            >
                                {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                                {isSaved ? t('hero_saved') : t('hero_my_list')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 text-slate-300 flex-1">
                    {/* Synopsis & Cast */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="md:col-span-2 space-y-2.5 sm:space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-base sm:text-lg font-bold text-white">{t('synopsis_title')}</h3>
                                <div className="flex items-center gap-1 p-0.5 bg-white/5 border border-white/10 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSynopsisLang('id')}
                                        disabled={isTranslatingSynopsis}
                                        title="Bahasa Indonesia"
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                            synopsisLang === 'id'
                                                ? 'bg-red-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        ID
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSynopsisLang('en')}
                                        disabled={isTranslatingSynopsis}
                                        title="English"
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
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
                                <p className="text-xs text-slate-400 italic animate-pulse">
                                    {synopsisLang === 'id' ? 'Menerjemahkan sinopsis...' : 'Translating synopsis...'}
                                </p>
                            ) : (
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                    {getDisplayedSynopsis()}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2.5 bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-white/10 text-xs">
                            <div>
                                <span className="text-slate-400 block font-semibold mb-0.5">{t('cast_title')}:</span>
                                <span className="text-white font-medium">
                                    {isLoadingCredits && castList.length === 0 ? (
                                        <span className="text-slate-500 italic">{language === 'en' ? 'Loading cast...' : 'Memuat pemeran...'}</span>
                                    ) : castList.length > 0 ? (
                                        castList.join(', ')
                                    ) : (
                                        'TMDB Lead Cast'
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-semibold mb-0.5">{t('director_title')}:</span>
                                <span className="text-white font-medium">
                                    {isLoadingCredits && !directorName ? (
                                        <span className="text-slate-500 italic">{language === 'en' ? 'Loading director...' : 'Memuat sutradara...'}</span>
                                    ) : directorName ? (
                                        directorName
                                    ) : (
                                        'Director'
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-semibold mb-0.5">{t('genre_title')}:</span>
                                <span className="text-red-400 font-semibold">{item.genres.join(', ')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Episodes List (if series) */}
                    {item.type === 'series' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-3 gap-3">
                                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                    <Film className="w-5 h-5 text-red-500" />
                                    {t('episodes_title')}
                                </h3>

                                {/* Dynamic Season Dropdown */}
                                {seasonsList.length > 0 && (
                                    <div className="relative inline-block min-w-[150px]">
                                        <select
                                            value={selectedSeasonNumber}
                                            onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                                            className="w-full appearance-none bg-slate-900/90 hover:bg-slate-900 border border-white/15 hover:border-red-500/50 text-white font-bold text-xs rounded-xl px-3.5 py-2 pr-8 cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                        >
                                            {seasonsList.map((s) => (
                                                <option key={s.seasonNumber} value={s.seasonNumber} className="bg-slate-900 text-white font-semibold">
                                                    {s.name || `Musim ${s.seasonNumber}`} {s.episodeCount ? `(${s.episodeCount} Episode)` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                )}
                            </div>

                            {isLoadingEpisodes && episodesList.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                                    <span>Memuat episode Musim {selectedSeasonNumber} dari TMDB API...</span>
                                </div>
                            ) : episodesList.length > 0 ? (
                                <div className="max-h-[320px] sm:max-h-[380px] overflow-y-auto pr-1.5 space-y-2.5 custom-episode-scrollbar">
                                    {episodesList.map((ep) => (
                                        <div
                                            key={ep.id}
                                            onClick={() => {
                                                onClose();
                                                onPlay(item, ep.episodeNumber, selectedSeasonNumber);
                                            }}
                                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-white/5 hover:border-red-500/40 transition cursor-pointer group"
                                        >
                                            <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-white/5">
                                                <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-red-600/30 flex items-center justify-center transition">
                                                    <Play className="w-5 h-5 text-white fill-white opacity-90 group-hover:scale-110 transition" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition truncate">
                                                        {ep.title}
                                                    </h4>
                                                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono shrink-0">
                                                        <Clock className="w-3 h-3 text-slate-500" />
                                                        {ep.duration}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 leading-relaxed">{ep.synopsis}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic py-4">Daftar episode tidak tersedia saat ini.</p>
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
                    <div className="pt-4 border-t border-white/10 sm:hidden">
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-red-600 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                            <span>Tutup Detail Film</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

