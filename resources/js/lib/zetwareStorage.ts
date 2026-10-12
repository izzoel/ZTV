/**
 * Utility for checking and resolving direct MP4 media files hosted on Zetware Cloud.
 * Example target: https://zetware.id/storage/movies/LANTERNS%20-%20S1E2_1920x960.mp4
 */

export interface ZetwareStreamOption {
    url: string;
    resolution: string;
    label: string;
}

export interface ZetwareMediaCheckResult {
    exists: boolean;
    url: string | null;
    streams: ZetwareStreamOption[];
    source: 'zetware' | 'streambert';
}

export interface ZetwareMediaCheckOptions {
    title: string;
    type: 'movie' | 'series';
    season?: number;
    episode?: number;
}

const COMMON_RESOLUTIONS = [
    '_1920x960',  // 2:1 cinema (e.g. LANTERNS - S1E2_1920x960.mp4)
    '_640x320',   // 2:1 mobile
    '_1920x1080', // 1080p 16:9
    '_1280x720',  // 720p 16:9
    '_640x360',   // 360p 16:9
    '_640x480',   // 480p 4:3
    '_1080p',
    '_720p',
    '_480p',
    '',           // Raw without resolution suffix (e.g. LANTERNS - S1E2.mp4)
];

export function generateZetwareStorageUrls(
    title: string,
    type: 'movie' | 'series',
    season: number = 1,
    episode: number = 1
): string[] {
    const cleanTitle = title.trim();
    if (!cleanTitle) return [];

    const candidates: string[] = [];
    const base = 'https://zetware.id/storage/movies';

    const titleVariants = Array.from(new Set([cleanTitle.toUpperCase(), cleanTitle]));

    if (type === 'series') {
        const epPatterns = Array.from(
            new Set([
                `S${season}E${episode}`,
                `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`,
            ])
        );

        for (const titleVar of titleVariants) {
            for (const ep of epPatterns) {
                for (const res of COMMON_RESOLUTIONS) {
                    const filename = `${titleVar} - ${ep}${res}.mp4`;
                    candidates.push(`${base}/${encodeURI(filename)}`);
                }
            }
        }
    } else {
        for (const titleVar of titleVariants) {
            for (const res of COMMON_RESOLUTIONS) {
                const filename = `${titleVar}${res}.mp4`;
                candidates.push(`${base}/${encodeURI(filename)}`);
            }
        }
    }

    // Deduplicate
    return Array.from(new Set(candidates));
}

export async function checkZetwareMediaExists(
    titleOrOptions: string | ZetwareMediaCheckOptions,
    type?: 'movie' | 'series',
    season: number = 1,
    episode: number = 1
): Promise<ZetwareMediaCheckResult> {
    let title: string;
    let mediaType: 'movie' | 'series';
    let s: number = 1;
    let ep: number = 1;

    if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
        title = titleOrOptions.title || '';
        mediaType = titleOrOptions.type || 'movie';
        s = titleOrOptions.season ?? 1;
        ep = titleOrOptions.episode ?? 1;
    } else {
        title = titleOrOptions || '';
        mediaType = type || 'movie';
        s = season;
        ep = episode;
    }

    const candidates = generateZetwareStorageUrls(title, mediaType, s, ep);
    if (candidates.length === 0) {
        return { exists: false, url: null, streams: [], source: 'streambert' };
    }

    try {
        const queryParams = new URLSearchParams();
        candidates.forEach((c) => queryParams.append('candidates[]', c));

        const response = await fetch(`/api/check-zetware-media?${queryParams.toString()}`);
        if (!response.ok) {
            return { exists: false, url: null, streams: [], source: 'streambert' };
        }

        const data = await response.json();
        if (data && data.exists && data.url) {
            return {
                exists: true,
                url: data.url,
                streams: Array.isArray(data.streams)
                    ? data.streams
                    : [{ url: data.url, resolution: 'Direct MP4', label: 'Direct MP4' }],
                source: 'zetware',
            };
        }
    } catch (err) {
        console.warn('Failed to check Zetware Cloud media availability:', err);
    }

    return { exists: false, url: null, streams: [], source: 'streambert' };
}
