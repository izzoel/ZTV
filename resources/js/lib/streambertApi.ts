/**
 * Streambert Video Streaming API Engine & Embed Providers
 * Extracted & Adapted from Streambert (/Applications/MAMP/htdocs/streambert)
 */

export interface PlayerSource {
    id: string;
    label: string;
    description: string;
    tag?: string | null;
    supportsProgress: boolean;
    colorParam?: string | null;
    langParam?: string | null;
    params: Record<string, string>;
    movieUrl: (id: string | number) => string;
    tvUrl: (id: string | number, season: number, ep: number) => string;
}

export const PLAYER_SOURCES: PlayerSource[] = [
    {
        id: 'vidsrc',
        label: 'VidSrc (VsEmbed)',
        description:
            'Server utama tercepat dengan kualitas hingga 4K Ultra HD & subtitle otomatis',
        tag: '4K',
        supportsProgress: true,
        colorParam: null,
        langParam: 'ds_lang',
        params: {},
        movieUrl: (id) => `https://vsembed.su/embed/movie/${id}`,
        tvUrl: (id, season, ep) =>
            `https://vsembed.su/embed/tv/${id}/${season}/${ep}`,
    },
    {
        id: 'videasy',
        label: 'Videasy Engine',
        description:
            'Server streaming HD cepat dengan dukungan subtitle otomatis',
        tag: 'HD',
        supportsProgress: true,
        colorParam: 'color',
        langParam: null,
        params: {
            overlay: 'true',
        },
        movieUrl: (id) => `https://player.videasy.to/movie/${id}`,
        tvUrl: (id, season, ep) =>
            `https://player.videasy.to/tv/${id}/${season}/${ep}`,
    },
    {
        id: 'vidking',
        label: 'Vidking Player',
        description: 'Multi-bahasa & fitur autoplay otomatis',
        tag: 'Fast',
        supportsProgress: true,
        colorParam: 'color',
        langParam: null,
        params: {
            autoPlay: 'true',
        },
        movieUrl: (id) => `https://www.vidking.net/embed/movie/${id}`,
        tvUrl: (id, season, ep) =>
            `https://www.vidking.net/embed/tv/${id}/${season}/${ep}`,
    },
    {
        id: 'vidlink',
        label: 'VidLink Pro',
        description: 'Server streaming HD dengan dukungan subtitle otomatis',
        tag: 'HD',
        supportsProgress: true,
        colorParam: 'primaryColor',
        langParam: null,
        params: {
            autoplay: 'false',
        },
        movieUrl: (id) => `https://vidlink.pro/movie/${id}`,
        tvUrl: (id, season, ep) =>
            `https://vidlink.pro/tv/${id}/${season}/${ep}`,
    },
    {
        id: '2embed',
        label: '2Embed Server',
        description: 'Server alternatif stabil untuk film dan serial TV',
        tag: null,
        supportsProgress: false,
        colorParam: null,
        langParam: null,
        params: {},
        movieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
        tvUrl: (id, season, ep) =>
            `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${ep}`,
    },
    {
        id: 'autoembed',
        label: 'AutoEmbed 4K',
        description: 'Pilihan terbaik untuk koneksi cepat dan buffering rendah',
        tag: '4K',
        supportsProgress: false,
        colorParam: null,
        langParam: null,
        params: {},
        movieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
        tvUrl: (id, season, ep) =>
            `https://player.autoembed.cc/embed/tv/${id}/${season}/${ep}`,
    },
];

/**
 * Generate full streaming URL based on provider, content type, TMDB ID, season, and episode
 */
export const getSourceUrl = (
    sourceId: string,
    type: 'movie' | 'series',
    tmdbId: string | number,
    season: number = 1,
    episode: number = 1,
    accentColor: string = 'e50914',
    subtitleLang: string = 'id',
    extraParams: Record<string, string> = {},
): string => {
    const src =
        PLAYER_SOURCES.find((s) => s.id === sourceId) ?? PLAYER_SOURCES[0];
    const baseUrl =
        type === 'movie'
            ? src.movieUrl(tmdbId)
            : src.tvUrl(tmdbId, season, episode);

    try {
        const url = new URL(baseUrl);

        Object.entries(src.params || {}).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        if (accentColor && src.colorParam) {
            url.searchParams.set(src.colorParam, accentColor.replace(/^#/, ''));
        }

        if (subtitleLang && src.langParam) {
            url.searchParams.set(src.langParam, subtitleLang);
        }

        Object.entries(extraParams).forEach(([key, value]) => {
            if (value != null) {
                url.searchParams.set(key, value);
            }
        });

        return url.toString();
    } catch {
        return baseUrl;
    }
};

/**
 * Default TMDB IDs for ZTV Media Catalog
 */
export const DEFAULT_TMDB_IDS: Record<string, number> = {
    'ztv-orig-01': 27205, // Inception
    'ztv-orig-02': 60574, // Peaky Blinders (TV)
    'ztv-mov-03': 157336, // Interstellar
    'ztv-mov-04': 299536, // Avengers: Infinity War
    'ztv-series-05': 62560, // Mr. Robot (TV)
    'ztv-mov-06': 550, // Fight Club
    'ztv-mov-07': 438631, // Dune
    'ztv-series-08': 92685, // Demon Slayer (TV)
    'ztv-mov-09': 597, // Titanic
    'ztv-series-10': 66732, // Stranger Things (TV)
};

/**
 * Helper to get TMDB ID for a media item
 */
export const getTmdbIdForMedia = (
    mediaId: string,
    itemTmdbId?: number | string,
): number | string => {
    if (itemTmdbId) return itemTmdbId;
    return DEFAULT_TMDB_IDS[mediaId] || 27205;
};
