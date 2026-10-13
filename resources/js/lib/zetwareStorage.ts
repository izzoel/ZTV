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
    '_1280x534',  // 2.39:1 scope 720p (e.g. SPIDER-MAN BRAND NEW DAY_1280x534.mp4)
    '_640x266',   // 2.39:1 scope mobile (e.g. SPIDER-MAN BRAND NEW DAY_640x266.mp4)
    '_1920x800',  // 2.39:1 ultrawide cinema
    '_1920x804',
    '_1280x536',
    '_1920x1080', // 1080p 16:9
    '_1280x720',  // 720p 16:9
    '_1920x960',  // 2:1 cinema FHD (e.g. LANTERNS - S1E2_1920x960.mp4)
    '_1280x640',  // 2:1 cinema HD (e.g. LANTERNS - S1E2_1280x640.mp4)
    '_640x320',   // 2:1 cinema mobile SD
    '_854x480',   // 480p 16:9
    '_640x360',   // 360p 16:9
    '_854x356',   // 2.39:1 480p
    '_640x268',
    '_960x480',   // 2:1 480p
    '_1280x960',  // 4:3
    '_640x480',   // 480p 4:3
    '_3840x2160', // 4K 16:9
    '_3840x1600', // 4K scope
    '_3840x1920', // 4K 2:1
    '_1080p',
    '_720p',
    '_480p',
    '_360p',
    '_2160p',
    '_4K',
    '_4k',
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
    const bases = ['https://zetware.id/storage/movies', 'https://zetware.id/storage/movie'];

    // Folder variants for {title} (e.g. "SPIDER-MAN BRAND NEW DAY", "LANTERNS")
    const sanitizedTitle = cleanTitle.replace(/[:\/\\?*"<>|]/g, '').trim();
    const sanitizedTitleNormalized = sanitizedTitle.replace(/\s+/g, ' ');

    // Prioritize sanitized uppercase title (matches filesystem folder standard)
    const folderVariants = Array.from(
        new Set([
            sanitizedTitleNormalized.toUpperCase(),
            sanitizedTitle.toUpperCase(),
            cleanTitle.toUpperCase(),
            sanitizedTitleNormalized,
            sanitizedTitle,
            cleanTitle,
            cleanTitle.toLowerCase(),
        ])
    ).filter(Boolean);

    // Title label variants for the filename
    const titleVariants = Array.from(
        new Set([
            sanitizedTitleNormalized.toUpperCase(),
            sanitizedTitle.toUpperCase(),
            cleanTitle.toUpperCase(),
            sanitizedTitleNormalized,
            sanitizedTitle,
            cleanTitle,
        ])
    ).filter(Boolean);

    if (type === 'series') {
        const epPatterns = Array.from(
            new Set([
                `S${season}E${episode}`,
                `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`,
            ])
        );

        // 1. PRIMARY: Subfolder target https://zetware.id/storage/movies/{title}/file and /storage/movie/{title}/file
        for (const base of bases) {
            for (const folder of folderVariants) {
                const encFolder = encodeURIComponent(folder);

                for (const ep of epPatterns) {
                    // Pattern A: {folder}/{title} - {ep}{res}.mp4 (e.g. LANTERNS/LANTERNS - S1E2_1920x960.mp4)
                    for (const titleVar of titleVariants) {
                        for (const res of COMMON_RESOLUTIONS) {
                            const filename = `${titleVar} - ${ep}${res}.mp4`;
                            candidates.push(`${base}/${encFolder}/${encodeURI(filename)}`);
                        }
                    }

                    // Pattern B: {folder}/{ep}{res}.mp4 (e.g. LANTERNS/S1E2_1920x960.mp4)
                    for (const res of COMMON_RESOLUTIONS) {
                        const filename = `${ep}${res}.mp4`;
                        candidates.push(`${base}/${encFolder}/${encodeURI(filename)}`);
                    }

                    // Pattern C: {folder}/{title}_{ep}{res}.mp4 (e.g. LANTERNS/LANTERNS_S1E2_1920x960.mp4)
                    for (const titleVar of titleVariants) {
                        for (const res of COMMON_RESOLUTIONS) {
                            const filename = `${titleVar}_${ep}${res}.mp4`;
                            candidates.push(`${base}/${encFolder}/${encodeURI(filename)}`);
                        }
                    }
                }
            }
        }

        // 2. FALLBACK: Flat root target https://zetware.id/storage/movies/file and /storage/movie/file
        for (const base of bases) {
            for (const titleVar of titleVariants) {
                for (const ep of epPatterns) {
                    for (const res of COMMON_RESOLUTIONS) {
                        const filename = `${titleVar} - ${ep}${res}.mp4`;
                        candidates.push(`${base}/${encodeURI(filename)}`);
                    }
                }
            }
        }
    } else {
        // 1. PRIMARY: Subfolder target https://zetware.id/storage/movies/{title}/file and /storage/movie/{title}/file
        for (const base of bases) {
            for (const folder of folderVariants) {
                const encFolder = encodeURIComponent(folder);

                // Pattern A: {folder}/{title}{res}.mp4 (e.g. FIGHT CLUB/FIGHT CLUB_1920x960.mp4)
                for (const titleVar of titleVariants) {
                    for (const res of COMMON_RESOLUTIONS) {
                        const filename = `${titleVar}${res}.mp4`;
                        candidates.push(`${base}/${encFolder}/${encodeURI(filename)}`);
                    }
                }

                // Pattern B: {folder}/{res}.mp4 (e.g. FIGHT CLUB/1920x960.mp4 or 1080p.mp4)
                for (const res of COMMON_RESOLUTIONS) {
                    if (res) {
                        const cleanRes = res.replace(/^_/, '');
                        candidates.push(`${base}/${encFolder}/${encodeURI(cleanRes)}.mp4`);
                        candidates.push(`${base}/${encFolder}/${encodeURI(res)}.mp4`);
                    }
                }

                // Pattern C: {folder}/movie.mp4 or video.mp4
                candidates.push(`${base}/${encFolder}/movie.mp4`);
                candidates.push(`${base}/${encFolder}/video.mp4`);
            }
        }

        // 2. FALLBACK: Flat root target https://zetware.id/storage/movies/file and /storage/movie/file
        for (const base of bases) {
            for (const titleVar of titleVariants) {
                for (const res of COMMON_RESOLUTIONS) {
                    const filename = `${titleVar}${res}.mp4`;
                    candidates.push(`${base}/${encodeURI(filename)}`);
                }
            }
        }
    }

    // Deduplicate while preserving priority
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

    if (!title.trim()) {
        return { exists: false, url: null, streams: [], source: 'streambert' };
    }

    const candidates = generateZetwareStorageUrls(title, mediaType, s, ep);
    if (candidates.length === 0) {
        return { exists: false, url: null, streams: [], source: 'streambert' };
    }

    try {
        const response = await fetch('/api/check-zetware-media', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                title: title.trim(),
                type: mediaType,
                season: s,
                episode: ep,
                candidates: candidates.slice(0, 30),
            }),
        });

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
