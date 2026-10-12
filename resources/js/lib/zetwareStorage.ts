/**
 * Utility for checking and resolving direct MP4 media files hosted on Zetware Storage.
 * Example target: https://zetware.id/storage/movies/LANTERNS%20-%20S1E1_640x320.mp4
 */

export interface ZetwareMediaCheckResult {
    exists: boolean;
    url: string | null;
    source: 'zetware' | 'streambert';
}

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

    if (type === 'series') {
        const uppercase = cleanTitle.toUpperCase();
        // 1. Primary requested: LANTERNS - S1E1_640x320.mp4
        candidates.push(`${base}/${encodeURIComponent(uppercase)}%20-%20S${season}E${episode}_640x320.mp4`);
        candidates.push(`${base}/${encodeURIComponent(`${uppercase} - S${season}E${episode}_640x320.mp4`)}`);
        // 2. Without resolution: LANTERNS - S1E1.mp4
        candidates.push(`${base}/${encodeURIComponent(uppercase)}%20-%20S${season}E${episode}.mp4`);
        candidates.push(`${base}/${encodeURIComponent(`${uppercase} - S${season}E${episode}.mp4`)}`);
        // 3. Raw case variants if different
        if (cleanTitle !== uppercase) {
            candidates.push(`${base}/${encodeURIComponent(cleanTitle)}%20-%20S${season}E${episode}_640x320.mp4`);
            candidates.push(`${base}/${encodeURIComponent(cleanTitle)}%20-%20S${season}E${episode}.mp4`);
        }
    } else {
        const uppercase = cleanTitle.toUpperCase();
        // 1. Primary movie resolution: TITLE_640x320.mp4
        candidates.push(`${base}/${encodeURIComponent(uppercase)}_640x320.mp4`);
        // 2. Normal TITLE.mp4
        candidates.push(`${base}/${encodeURIComponent(uppercase)}.mp4`);
        // 3. Raw case variants
        if (cleanTitle !== uppercase) {
            candidates.push(`${base}/${encodeURIComponent(cleanTitle)}_640x320.mp4`);
            candidates.push(`${base}/${encodeURIComponent(cleanTitle)}.mp4`);
        }
    }

    // Deduplicate
    return Array.from(new Set(candidates));
}

export async function checkZetwareMediaExists(
    title: string,
    type: 'movie' | 'series',
    season: number = 1,
    episode: number = 1
): Promise<ZetwareMediaCheckResult> {
    const candidates = generateZetwareStorageUrls(title, type, season, episode);
    if (candidates.length === 0) {
        return { exists: false, url: null, source: 'streambert' };
    }

    try {
        const queryParams = new URLSearchParams();
        candidates.forEach((c) => queryParams.append('candidates[]', c));

        const response = await fetch(`/api/check-zetware-media?${queryParams.toString()}`);
        if (!response.ok) {
            return { exists: false, url: null, source: 'streambert' };
        }

        const data = await response.json();
        if (data && data.exists && data.url) {
            return {
                exists: true,
                url: data.url,
                source: 'zetware'
            };
        }
    } catch (err) {
        console.warn('Failed to check Zetware storage media availability:', err);
    }

    return { exists: false, url: null, source: 'streambert' };
}
