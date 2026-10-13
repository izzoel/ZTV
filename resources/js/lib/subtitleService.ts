/**
 * Subtitle Service for ZTV Stream
 * Automatically fetches & resolves subtitles (Bahasa Indonesia, English, etc.) for Zetware Cloud.
 */

export interface SubtitleTrack {
    id: string;
    lang: string;
    rawLang?: string;
    label: string;
    fileName?: string;
    url: string;
    source?: string;
    isDefault?: boolean;
}

export interface SubtitleSearchResponse {
    success: boolean;
    imdb_id?: string;
    subtitles: SubtitleTrack[];
}

/**
 * Fetch available subtitles for a movie or TV show episode
 */
export async function fetchSubtitlesForMedia(
    tmdbId?: string | number,
    type: 'movie' | 'series' = 'movie',
    season: number = 1,
    episode: number = 1,
    imdbId?: string
): Promise<SubtitleTrack[]> {
    if (!tmdbId && !imdbId) return [];

    try {
        const params = new URLSearchParams();
        if (tmdbId) params.set('tmdb_id', String(tmdbId));
        if (imdbId) params.set('imdb_id', imdbId);
        params.set('type', type);
        if (type === 'series') {
            params.set('season', String(season));
            params.set('episode', String(episode));
        }

        const res = await fetch(`/api/subtitles?${params.toString()}`);
        if (!res.ok) return [];

        const data: SubtitleSearchResponse = await res.json();
        return Array.isArray(data.subtitles) ? data.subtitles : [];
    } catch (err) {
        console.warn('Failed to fetch subtitles:', err);
        return [];
    }
}

/**
 * Convert raw SRT text to WebVTT format and return a Blob URL
 * Useful for user-uploaded custom local subtitles
 */
export function convertSrtToVttBlob(srtText: string): string {
    let clean = srtText.replace(/^\uFEFF/, '').replace(/\r\n|\r/g, '\n');
    let vtt = clean;

    if (!clean.trim().startsWith('WEBVTT')) {
        // Replace 00:00:00,000 -> 00:00:00.000
        const withDots = clean.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
        vtt = `WEBVTT\n\n${withDots.trim()}\n`;
    }

    const blob = new Blob([vtt], { type: 'text/vtt' });
    return URL.createObjectURL(blob);
}
