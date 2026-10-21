/**
 * TMDB (TheMovieDB) Live API Service for ZTV Stream
 * Fetches real movies, backdrops, posters, ratings & metadata using TMDB API Read Access Token.
 */

import { MediaItem, Episode, FALLBACK_MOVIES } from '@/data/movies';

export const TMDB_READ_TOKEN =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZjNiOGQ3ZTAyZGViZjMzMDJkZTkyNzM2M2Y5MDVhNSIsIm5iZiI6MTc5MTMxNjg4Ny40MjUsInN1YiI6IjZhYzU1Mzk3N2ZhZGRlYzkyZGJiYzM2ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1QPNbFQVmR2xtf4vAh0Cb0I0XfuEM2uyQo0ksHE0NTs';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_POSTER = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMG_BACKDROP = 'https://image.tmdb.org/t/p/w1280';

/// Genre ID map according to official TMDB specifications
const GENRE_MAP: Record<number, string> = {
    28: 'Aksi',
    12: 'Petualangan',
    16: 'Anime & Animasi',
    35: 'Komedi',
    80: 'Kriminal',
    99: 'Dokumenter',
    18: 'Drama',
    10751: 'Keluarga',
    14: 'Petualangan & Fantasi',
    36: 'Sejarah',
    27: 'Horor & Misteri',
    10402: 'Musik',
    9648: 'Horor & Misteri',
    10749: 'Romantis',
    878: 'Aksi & Sci-Fi',
    10770: 'Film TV',
    53: 'Horor & Misteri',
    10752: 'Perang',
    37: 'Western',
    10759: 'Aksi & Sci-Fi',
    10762: 'Anak-anak',
    10763: 'Berita',
    10764: 'Reality',
    10765: 'Aksi & Sci-Fi',
    10766: 'Drama',
    10767: 'Talkshow',
    10768: 'Perang & Politik',
};

/**
 * Perform authorized request to TMDB API
 */

export async function fetchFromTmdb(
    endpoint: string,
    params: Record<string, string> = {},
): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
        url.searchParams.set('language', 'id-ID'); // Preferred Indonesian language metadata

        Object.entries(params).forEach(([key, val]) => {
            url.searchParams.set(key, val);
        });

        const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${TMDB_READ_TOKEN}`,
                'Content-Type': 'application/json;charset=utf-8',
            },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`TMDB API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        console.warn('TMDB Fetch fallback:', error);
        return null;
    }
}

/**
 * Cache for translated overviews to avoid redundant network calls
 */
const translationCache = new Map<string, string>();

/**
 * Check if text appears to be primarily English
 */
export const isEngText = (text: string): boolean => {
    if (!text) return false;
    const lower = ` ${text.toLowerCase()} `;
    return [
        ' the ',
        ' and ',
        ' with ',
        ' from ',
        ' after ',
        ' that ',
        ' when ',
        ' in a ',
        ' of ',
        ' to ',
        ' his ',
        ' her ',
        ' their ',
        ' he ',
        ' she ',
    ].some((w) => lower.includes(w));
};

/**
 * Translate text between English and Indonesian using free Google Translate service
 */
export async function translateText(
    text: string,
    from: 'en' | 'id' = 'en',
    to: 'id' | 'en' = 'id',
): Promise<string> {
    if (!text || text.trim().length === 0) return '';
    if (from === to) return text;

    const cacheKey = `${from}_${to}_${text.trim()}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
    }

    try {
        const url = new URL(
            'https://translate.googleapis.com/translate_a/single',
        );
        url.searchParams.set('client', 'gtx');
        url.searchParams.set('sl', from);
        url.searchParams.set('tl', to);
        url.searchParams.set('dt', 't');
        url.searchParams.set('q', text);

        const res = await fetch(url.toString());
        if (!res.ok) return text;

        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
            const translated = data[0].map((chunk: any) => chunk[0]).join('');
            if (translated && translated.trim().length > 0) {
                const result = translated.trim();
                translationCache.set(cacheKey, result);
                return result;
            }
        }
    } catch (err) {
        console.warn('Translation failed, fallback to original overview:', err);
    }

    return text;
}

export function formatTmdbItemToMedia(
    item: any,
    forceType?: 'movie' | 'series',
    isOriginal: boolean = false,
    enOverviewMap?: Map<number | string, string>,
): MediaItem | null {
    if (!item || (!item.poster_path && !item.backdrop_path)) return null;

    const isMovie = forceType
        ? forceType === 'movie'
        : item.media_type === 'movie' || Boolean(item.release_date);
    const title =
        item.title ||
        item.name ||
        item.original_title ||
        item.original_name ||
        'Judul Film';
    const releaseDate =
        item.release_date || item.first_air_date || '2025-01-01';
    const year = parseInt(releaseDate.split('-')[0]) || 2025;

    // Map genres directly from genre_ids or genre objects
    const genreNames: string[] = [];
    if (item.genres && Array.isArray(item.genres)) {
        item.genres.forEach((g: any) => {
            if (g.name && !genreNames.includes(g.name)) genreNames.push(g.name);
        });
    }
    if (item.genre_ids && Array.isArray(item.genre_ids)) {
        item.genre_ids.forEach((gid: number) => {
            if (GENRE_MAP[gid] && !genreNames.includes(GENRE_MAP[gid])) {
                genreNames.push(GENRE_MAP[gid]);
            }
        });
    }
    if (genreNames.length === 0) {
        genreNames.push(isMovie ? 'Aksi & Sci-Fi' : 'Drama');
    }

    const voteAvg = item.vote_average ? item.vote_average.toFixed(1) : '8.5';
    const matchVal = Math.min(
        99,
        Math.max(82, Math.round((item.vote_average || 8) * 10)),
    );

    const posterUrl = item.poster_path
        ? `${TMDB_IMG_POSTER}${item.poster_path}`
        : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop';

    const backdropUrl = item.backdrop_path
        ? `${TMDB_IMG_BACKDROP}${item.backdrop_path}`
        : posterUrl;

    const rawOverview = item.overview ? item.overview.trim() : '';
    const rawEnOverview = enOverviewMap?.get(item.id)?.trim() || '';

    let synopsisId = '';
    let synopsisEn = '';

    // Selalu prioritaskan overview riil dari API TMDB
    if (rawOverview && rawEnOverview && rawOverview !== rawEnOverview) {
        if (isEngText(rawOverview) && !isEngText(rawEnOverview)) {
            synopsisId = rawEnOverview;
            synopsisEn = rawOverview;
        } else {
            synopsisId = rawOverview;
            synopsisEn = rawEnOverview;
        }
    } else if (rawOverview) {
        synopsisId = rawOverview;
        synopsisEn = rawEnOverview || rawOverview;
    } else if (rawEnOverview) {
        synopsisId = rawEnOverview;
        synopsisEn = rawEnOverview;
    } else {
        synopsisId = 'Sinopsis resmi belum tersedia.';
        synopsisEn = 'Official synopsis is not yet available.';
    }

    return {
        id: `tmdb-${isMovie ? 'mov' : 'tv'}-${item.id}`,
        tmdbId: item.id,
        title: title.toUpperCase(),
        type: isMovie ? 'movie' : 'series',
        rating: voteAvg,
        matchScore: `${matchVal}% Cocok`,
        year: year,
        ageRating: item.adult ? '18+' : item.vote_average > 7.8 ? '16+' : '13+',
        duration: isMovie ? '2j 15m' : '1 Musim (10 Episode)',
        quality: item.vote_average > 8.0 ? '4K Ultra HD' : 'HD',
        genres: genreNames,
        synopsis: synopsisId,
        synopsisEn: synopsisEn,
        cast: [],
        director: '',
        posterUrl: posterUrl,
        backdropUrl: backdropUrl,
        videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        isOriginal: isOriginal,
        isTrending: true,
        episodes: !isMovie
            ? [
                  {
                      id: `ep-1-${item.id}`,
                      episodeNumber: 1,
                      title: 'Eps 1: Permulaan',
                      duration: '45m',
                      thumbnail: backdropUrl,
                      synopsis:
                          'Episode pertama memperkenalkan karakter utama dan konflik mendasar cerita.',
                  },
                  {
                      id: `ep-2-${item.id}`,
                      episodeNumber: 2,
                      title: 'Eps 2: Konflik Utama',
                      duration: '50m',
                      thumbnail: backdropUrl,
                      synopsis:
                          'Ketegangan semakin memuncak saat rahasia tersembunyi mulai terungkap.',
                  },
              ]
            : undefined,
    };
}

/**
 * Search movies & TV shows live on TMDB
 */
export async function searchTmdbContent(query: string): Promise<MediaItem[]> {
    if (!query || query.trim().length < 2) return [];
    try {
        const [resId, resEn] = await Promise.all([
            fetchFromTmdb('/search/multi', {
                query: query.trim(),
                language: 'id-ID',
            }),
            fetchFromTmdb('/search/multi', {
                query: query.trim(),
                language: 'en-US',
            }),
        ]);

        const enMap = new Map<number | string, string>();
        if (resEn?.results && Array.isArray(resEn.results)) {
            resEn.results.forEach((item: any) => {
                if (item?.id && item?.overview) {
                    enMap.set(item.id, item.overview.trim());
                }
            });
        }

        if (!resId || !resId.results || !Array.isArray(resId.results))
            return [];
        return resId.results
            .map((item: any) =>
                formatTmdbItemToMedia(item, undefined, false, enMap),
            )
            .filter(
                (item: MediaItem | null): item is MediaItem => item !== null,
            )
            .slice(0, 10);
    } catch {
        return [];
    }
}

/**
 * Fetch catalog of live TMDB items for homepage categories
 */
export async function fetchLiveTmdbCatalog(): Promise<{
    featured: MediaItem[];
    trending: MediaItem[];
    top10: MediaItem[];
    action: MediaItem[];
    horror: MediaItem[];
    series: MediaItem[];
    all: MediaItem[];
}> {
    const [
        trendingRes,
        trendingEnRes,
        popularMoviesRes,
        popularMoviesEnRes,
        popularTvRes,
        popularTvEnRes,
        actionRes,
        actionEnRes,
        horrorRes,
        horrorEnRes,
    ] = await Promise.all([
        fetchFromTmdb('/trending/all/day', { language: 'id-ID' }),
        fetchFromTmdb('/trending/all/day', { language: 'en-US' }),
        fetchFromTmdb('/movie/popular', { language: 'id-ID' }),
        fetchFromTmdb('/movie/popular', { language: 'en-US' }),
        fetchFromTmdb('/tv/popular', { language: 'id-ID' }),
        fetchFromTmdb('/tv/popular', { language: 'en-US' }),
        fetchFromTmdb('/discover/movie', {
            with_genres: '28,878',
            sort_by: 'popularity.desc',
            language: 'id-ID',
        }),
        fetchFromTmdb('/discover/movie', {
            with_genres: '28,878',
            sort_by: 'popularity.desc',
            language: 'en-US',
        }),
        fetchFromTmdb('/discover/movie', {
            with_genres: '27,53',
            sort_by: 'popularity.desc',
            language: 'id-ID',
        }),
        fetchFromTmdb('/discover/movie', {
            with_genres: '27,53',
            sort_by: 'popularity.desc',
            language: 'en-US',
        }),
    ]);

    const enOverviewMap = new Map<number | string, string>();
    [
        ...(trendingEnRes?.results || []),
        ...(popularMoviesEnRes?.results || []),
        ...(popularTvEnRes?.results || []),
        ...(actionEnRes?.results || []),
        ...(horrorEnRes?.results || []),
    ].forEach((item: any) => {
        if (
            item &&
            item.id &&
            item.overview &&
            item.overview.trim().length > 5
        ) {
            enOverviewMap.set(item.id, item.overview.trim());
        }
    });

    const formatList = (
        results: any[],
        forceType?: 'movie' | 'series',
        isOriginal: boolean = false,
    ) => {
        if (!results || !Array.isArray(results)) return [];
        return results
            .map((item) =>
                formatTmdbItemToMedia(
                    item,
                    forceType,
                    isOriginal,
                    enOverviewMap,
                ),
            )
            .filter((item): item is MediaItem => item !== null);
    };

    const trending = formatList(trendingRes?.results || []);
    const popularMovies = formatList(popularMoviesRes?.results || [], 'movie');
    const popularTv = formatList(popularTvRes?.results || [], 'series', true);
    const actionMovies = formatList(actionRes?.results || [], 'movie');
    const horrorMovies = formatList(horrorRes?.results || [], 'movie');

    // Build Featured Items for Hero Carousel (top 5 rated/trending items)
    const featured = [...trending, ...popularMovies]
        .filter(
            (item, index, self) =>
                index === self.findIndex((t) => t.tmdbId === item.tmdbId),
        )
        .slice(0, 5);

    // Build Top 10 with rank numbers 1..10
    const top10 = [...popularMovies, ...popularTv]
        .slice(0, 10)
        .map((item, idx) => ({ ...item, top10Rank: idx + 1 }));

    // Combined catalog deduplicated by tmdbId
    const allMap = new Map<string | number, MediaItem>();
    [
        ...featured,
        ...trending,
        ...popularMovies,
        ...popularTv,
        ...actionMovies,
        ...horrorMovies,
    ].forEach((item) => {
        if (item.tmdbId && !allMap.has(item.tmdbId)) {
            allMap.set(item.tmdbId, item);
        }
    });

    const all = Array.from(allMap.values());

    if (all.length === 0) {
        return {
            featured: FALLBACK_MOVIES.slice(0, 3),
            trending: FALLBACK_MOVIES,
            top10: FALLBACK_MOVIES.slice(0, 10).map((m, idx) => ({
                ...m,
                top10Rank: idx + 1,
            })),
            action: FALLBACK_MOVIES.filter((m) =>
                m.genres.some((g) => g.includes('Aksi')),
            ),
            horror: FALLBACK_MOVIES.filter((m) =>
                m.genres.some((g) => g.includes('Horor')),
            ),
            series: FALLBACK_MOVIES.filter((m) => m.type === 'series'),
            all: FALLBACK_MOVIES,
        };
    }

    return {
        featured: featured.length > 0 ? featured : FALLBACK_MOVIES.slice(0, 3),
        trending: trending.length > 0 ? trending : FALLBACK_MOVIES,
        top10:
            top10.length > 0
                ? top10
                : FALLBACK_MOVIES.slice(0, 10).map((m, idx) => ({
                      ...m,
                      top10Rank: idx + 1,
                  })),
        action: actionMovies.length > 0 ? actionMovies : FALLBACK_MOVIES,
        horror: horrorMovies.length > 0 ? horrorMovies : FALLBACK_MOVIES,
        series:
            popularTv.length > 0
                ? popularTv
                : FALLBACK_MOVIES.filter((m) => m.type === 'series'),
        all: all,
    };
}

/**
 * Fetch paginated content for Infinite Scroll (Movie & Series)
 */
export async function fetchMoreTmdbContent(
    type: 'movie' | 'series',
    page: number,
): Promise<MediaItem[]> {
    try {
        const endpoint = type === 'movie' ? '/movie/popular' : '/tv/popular';
        const [resId, resEn] = await Promise.all([
            fetchFromTmdb(endpoint, { page: String(page), language: 'id-ID' }),
            fetchFromTmdb(endpoint, { page: String(page), language: 'en-US' }),
        ]);

        const enMap = new Map<number | string, string>();
        if (resEn?.results && Array.isArray(resEn.results)) {
            resEn.results.forEach((item: any) => {
                if (item?.id && item?.overview) {
                    enMap.set(item.id, item.overview.trim());
                }
            });
        }

        if (!resId || !resId.results || !Array.isArray(resId.results))
            return [];
        return resId.results
            .map((item: any) =>
                formatTmdbItemToMedia(item, type, type === 'series', enMap),
            )
            .filter(
                (item: MediaItem | null): item is MediaItem => item !== null,
            );
    } catch {
        return [];
    }
}

/**
 * Fetch real Cast & Director details for a specific movie or series from TMDB API
 */
export async function fetchTmdbCredits(
    tmdbId: number | string,
    type: 'movie' | 'series',
): Promise<{ cast: string[]; director: string }> {
    if (!tmdbId) return { cast: [], director: '' };
    try {
        const endpoint =
            type === 'movie'
                ? `/movie/${tmdbId}/credits`
                : `/tv/${tmdbId}/credits`;
        const res = await fetchFromTmdb(endpoint);
        if (!res) return { cast: [], director: '' };

        const castNames: string[] =
            res.cast && Array.isArray(res.cast)
                ? res.cast.slice(0, 5).map((c: any) => c.name)
                : [];

        let directorName = '';
        if (res.crew && Array.isArray(res.crew)) {
            const dirObj = res.crew.find(
                (c: any) =>
                    c.job === 'Director' ||
                    c.known_for_department === 'Directing',
            );
            if (dirObj) {
                directorName = dirObj.name;
            }
        }
        if (!directorName && res.cast && res.cast.length > 0) {
            // For series, creators are sometimes listed under created_by, or first cast lead
            const createdObj = res.crew?.find(
                (c: any) =>
                    c.job === 'Executive Producer' || c.job === 'Producer',
            );
            if (createdObj) {
                directorName = createdObj.name;
            } else {
                directorName = res.cast[0].name;
            }
        }

        return {
            cast: castNames,
            director: directorName || 'Sutradara Utama',
        };
    } catch {
        return { cast: [], director: '' };
    }
}

/**
 * Fetch real TV Series Season Episode details live from TMDB API
 */
export async function fetchTmdbEpisodes(
    tmdbId: number | string,
    seasonNumber: number = 1,
): Promise<Episode[]> {
    if (!tmdbId) return [];
    try {
        const res = await fetchFromTmdb(`/tv/${tmdbId}/season/${seasonNumber}`);
        if (!res || !res.episodes || !Array.isArray(res.episodes)) return [];

        return res.episodes.map((ep: any) => ({
            id: `ep-${ep.id || ep.episode_number}-${tmdbId}`,
            episodeNumber: ep.episode_number || 1,
            title: ep.name
                ? `Eps ${ep.episode_number}: ${ep.name}`
                : `Episode ${ep.episode_number}`,
            duration: ep.runtime ? `${ep.runtime}m` : '45m',
            thumbnail: ep.still_path
                ? `${TMDB_IMG_POSTER}${ep.still_path}`
                : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
            synopsis:
                ep.overview && ep.overview.trim().length > 5
                    ? ep.overview
                    : 'Sinopsis belum tersedia',
        }));
    } catch {
        return [];
    }
}

/**
 * Fetch real TV Series Season list & metadata from TMDB API
 */
export async function fetchTmdbTvSeasons(
    tmdbId: number | string,
): Promise<{ seasonNumber: number; name: string; episodeCount: number }[]> {
    if (!tmdbId)
        return [{ seasonNumber: 1, name: 'Musim 1', episodeCount: 10 }];
    try {
        const res = await fetchFromTmdb(`/tv/${tmdbId}`);
        if (!res || !res.seasons || !Array.isArray(res.seasons)) {
            return [{ seasonNumber: 1, name: 'Musim 1', episodeCount: 10 }];
        }

        const filtered = res.seasons
            .filter((s: any) => s.season_number > 0) // Exclude Specials (Season 0)
            .map((s: any) => ({
                seasonNumber: s.season_number,
                name: s.name || `Musim ${s.season_number}`,
                episodeCount: s.episode_count || 10,
            }));

        return filtered.length > 0
            ? filtered
            : [{ seasonNumber: 1, name: 'Musim 1', episodeCount: 10 }];
    } catch {
        return [{ seasonNumber: 1, name: 'Musim 1', episodeCount: 10 }];
    }
}

/**
 * Fetch a single MediaItem by ID (from FALLBACK_MOVIES or TMDB Live API)
 */
export async function fetchMediaById(
    id: string | number,
): Promise<MediaItem | null> {
    const strId = String(id).trim();
    if (!strId) return null;

    // 1. Check in FALLBACK_MOVIES
    const foundFallback = FALLBACK_MOVIES.find(
        (m) => m.id === strId || String(m.tmdbId) === strId,
    );
    if (foundFallback) {
        return foundFallback;
    }

    // 2. Determine type and numeric TMDB ID
    let isMovie = true;
    let numericId: string = strId;

    if (strId.startsWith('tmdb-tv-')) {
        isMovie = false;
        numericId = strId.replace('tmdb-tv-', '');
    } else if (strId.startsWith('tmdb-mov-')) {
        isMovie = true;
        numericId = strId.replace('tmdb-mov-', '');
    }

    // 3. Fetch from TMDB API
    try {
        if (!isMovie) {
            const [resId, resEn] = await Promise.all([
                fetchFromTmdb(`/tv/${numericId}`, { language: 'id-ID' }),
                fetchFromTmdb(`/tv/${numericId}`, { language: 'en-US' }),
            ]);
            if (resId && resId.id) {
                const enMap = new Map<number | string, string>();
                let idOverview = resId.overview?.trim() || '';
                let enOverview = resEn?.overview?.trim() || '';

                // Jika overview Indonesia kosong atau masih bahasa Inggris, terjemahkan dari overview EN
                if ((!idOverview || isEngText(idOverview)) && enOverview) {
                    const translatedId = await translateText(
                        enOverview,
                        'en',
                        'id',
                    );
                    if (translatedId) idOverview = translatedId;
                } else if (!enOverview && idOverview) {
                    const translatedEn = await translateText(
                        idOverview,
                        'id',
                        'en',
                    );
                    if (translatedEn) enOverview = translatedEn;
                }

                if (idOverview) resId.overview = idOverview;
                if (enOverview) enMap.set(resId.id, enOverview);

                return formatTmdbItemToMedia(resId, 'series', false, enMap);
            }
        }

        // Try movie
        const [resId, resEn] = await Promise.all([
            fetchFromTmdb(`/movie/${numericId}`, { language: 'id-ID' }),
            fetchFromTmdb(`/movie/${numericId}`, { language: 'en-US' }),
        ]);
        if (resId && resId.id) {
            const enMap = new Map<number | string, string>();
            let idOverview = resId.overview?.trim() || '';
            let enOverview = resEn?.overview?.trim() || '';

            // Jika overview Indonesia kosong atau masih bahasa Inggris, terjemahkan dari overview EN
            if ((!idOverview || isEngText(idOverview)) && enOverview) {
                const translatedId = await translateText(
                    enOverview,
                    'en',
                    'id',
                );
                if (translatedId) idOverview = translatedId;
            } else if (!enOverview && idOverview) {
                const translatedEn = await translateText(
                    idOverview,
                    'id',
                    'en',
                );
                if (translatedEn) enOverview = translatedEn;
            }

            if (idOverview) resId.overview = idOverview;
            if (enOverview) enMap.set(resId.id, enOverview);

            return formatTmdbItemToMedia(resId, 'movie', false, enMap);
        }

        // Fallback to TV if movie failed and not explicitly prefixed
        if (isMovie && !strId.startsWith('tmdb-mov-')) {
            const [tvId, tvEn] = await Promise.all([
                fetchFromTmdb(`/tv/${numericId}`, { language: 'id-ID' }),
                fetchFromTmdb(`/tv/${numericId}`, { language: 'en-US' }),
            ]);
            if (tvId && tvId.id) {
                const enMap = new Map<number | string, string>();
                let idOverview = tvId.overview?.trim() || '';
                let enOverview = tvEn?.overview?.trim() || '';

                if ((!idOverview || isEngText(idOverview)) && enOverview) {
                    const translatedId = await translateText(
                        enOverview,
                        'en',
                        'id',
                    );
                    if (translatedId) idOverview = translatedId;
                } else if (!enOverview && idOverview) {
                    const translatedEn = await translateText(
                        idOverview,
                        'id',
                        'en',
                    );
                    if (translatedEn) enOverview = translatedEn;
                }

                if (idOverview) tvId.overview = idOverview;
                if (enOverview) enMap.set(tvId.id, enOverview);

                return formatTmdbItemToMedia(tvId, 'series', false, enMap);
            }
        }
    } catch (e) {
        console.warn('Error fetching media by ID:', e);
    }

    return null;
}
