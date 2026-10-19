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
    '_1920x800',  // 2.39:1 ultrawide cinema (HOPE, INSIDIOUS, SPIDER-MAN)
    '_1920x804',  // 2.39:1 scope (MATCHBOX THE MOVIE)
    '_1920x1000', // 1.92:1 cinema (THE ODYSSEY)
    '_1920x960',  // 2:1 cinema FHD (LANTERNS)
    '_1920x1080', // 1080p 16:9
    '_1280x534',  // 2.39:1 scope 720p (ANIMALS, HOPE, INSIDIOUS)
    '_1280x536',  // 2.39:1 scope (MATCHBOX THE MOVIE)
    '_1280x666',  // 1.92:1 cinema (THE ODYSSEY)
    '_1280x640',  // 2:1 cinema HD (LANTERNS)
    '_1280x720',  // 720p 16:9
    '_640x266',   // 2.39:1 scope mobile (SPIDER-MAN, INSIDIOUS)
    '_640x268',   // 2.39:1 scope mobile (MATCHBOX THE MOVIE)
    '_640x334',   // 1.92:1 cinema mobile (THE ODYSSEY)
    '_640x320',   // 2:1 cinema mobile SD (LANTERNS)
    '_640x360',   // 360p 16:9
    '_854x480',   // 480p 16:9
    '_854x356',   // 2.39:1 480p
    '_960x480',   // 2:1 480p
    '_3840x2160', // 4K 16:9
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

    const sanitizedTitle = cleanTitle.replace(/[:\/\\?*"<>|]/g, '').trim();
    const sanitizedTitleNormalized = sanitizedTitle.replace(/\s+/g, ' ');
    const upperClean = sanitizedTitleNormalized.toUpperCase();

    // Known cloud folders on domains/zetware.id/public_html/storage/movies
    const knownCloudFolders: Record<string, string[]> = {
        'ANIMALS': ['ANIMALS', 'ANIMAL'],
        'HOPE': ['HOPE'],
        'INSIDIOUS OUT OF THE FURTHER': ['INSIDIOUS OUT OF THE FURTHER', 'INSIDIOUS THE FURTHER', 'INSIDIOUS'],
        'LANTERNS': ['LANTERNS', 'LANTERN'],
        'MATCHBOX THE MOVIE': ['MATCHBOX THE MOVIE', 'MATCHBOX'],
        'SPIDER-MAN BRAND NEW DAY': ['SPIDER-MAN BRAND NEW DAY', 'SPIDER MAN BRAND NEW DAY', 'BRAND NEW DAY'],
        'THE ODYSSEY': ['THE ODYSSEY', 'ODYSSEY'],
        'TREASURE ISLAND': ['TREASURE ISLAND'],
    };

    const matchedCloudFolders: string[] = [];
    for (const [cloudFolder, aliases] of Object.entries(knownCloudFolders)) {
        for (const alias of aliases) {
            if (upperClean === alias || upperClean.includes(alias) || alias.includes(upperClean)) {
                matchedCloudFolders.push(cloudFolder);
                break;
            }
        }
    }

    // Prioritize matched uppercase cloud folder
    const folderVariants = Array.from(
        new Set([
            ...matchedCloudFolders,
            upperClean,
            sanitizedTitle.toUpperCase(),
            cleanTitle.toUpperCase(),
            upperClean.replace(/^THE\s+/i, ''),
            `THE ${upperClean.replace(/^THE\s+/i, '')}`,
            upperClean.replace(/\s+THE\s+MOVIE$/i, ''),
            upperClean.replace(/\s+MOVIE$/i, ''),
            `${upperClean} THE MOVIE`,
            upperClean.replace(/-/g, ' '),
            upperClean.replace(/\s+/g, '-'),
            sanitizedTitleNormalized,
            sanitizedTitle,
            cleanTitle,
            cleanTitle.toLowerCase(),
        ])
    ).filter(Boolean);

    // Title label variants for the filename
    const titleVariants = Array.from(
        new Set([
            ...matchedCloudFolders,
            upperClean,
            sanitizedTitle.toUpperCase(),
            cleanTitle.toUpperCase(),
            upperClean.replace(/^THE\s+/i, ''),
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

        // 1. PRIMARY: Subfolder target https://zetware.id/storage/movies/{title}/file
        for (const base of bases) {
            for (const folder of folderVariants) {
                const encFolder = encodeURIComponent(folder);

                for (const ep of epPatterns) {
                    // Pattern A: {folder}/{folder} - {ep}{res}.mp4 (e.g. LANTERNS/LANTERNS - S1E2_1920x960.mp4)
                    for (const res of COMMON_RESOLUTIONS) {
                        const filename = `${folder} - ${ep}${res}.mp4`;
                        candidates.push(`${base}/${encFolder}/${encodeURI(filename)}`);
                    }

                    // Pattern B: {folder}/{tv} - {ep}{res}.mp4
                    for (const titleVar of titleVariants) {
                        if (titleVar !== folder) {
                            for (const res of COMMON_RESOLUTIONS) {
                                const filename = `${titleVar} - ${ep}${res}.mp4`;
                                candidates.push(`${base}/${encFolder}/${encodeURI(filename)}`);
                            }
                        }
                    }

                    // Pattern C: {folder}/{ep}{res}.mp4 (e.g. LANTERNS/S1E2_1920x960.mp4)
                    for (const res of COMMON_RESOLUTIONS) {
                        const filename = `${ep}${res}.mp4`;
                        candidates.push(`${base}/${encFolder}/${encodeURI(filename)}`);
                    }
                }
            }
        }

        // 2. FALLBACK: Flat root target https://zetware.id/storage/movies/file
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
        // 1. PRIMARY: Subfolder target https://zetware.id/storage/movies/{title}/file
        for (const base of bases) {
            for (const folder of folderVariants) {
                const encFolder = encodeURIComponent(folder);

                // Pattern A: {folder}/{folder}{res}.mp4 (e.g. HOPE/HOPE_1920x800.mp4)
                for (const res of COMMON_RESOLUTIONS) {
                    const filename = `${folder}${res}.mp4`;
                    candidates.push(`${base}/${encFolder}/${encodeURI(filename)}`);
                }

                // Pattern B: {folder}/{tv}{res}.mp4
                for (const titleVar of titleVariants) {
                    if (titleVar !== folder) {
                        for (const res of COMMON_RESOLUTIONS) {
                            const filename = `${titleVar}${res}.mp4`;
                            candidates.push(`${base}/${encFolder}/${encodeURI(filename)}`);
                        }
                    }
                }

                // Pattern C: {folder}/{res}.mp4
                for (const res of COMMON_RESOLUTIONS) {
                    if (res) {
                        const cleanRes = res.replace(/^_/, '');
                        candidates.push(`${base}/${encFolder}/${encodeURI(cleanRes)}.mp4`);
                        candidates.push(`${base}/${encFolder}/${encodeURI(res)}.mp4`);
                    }
                }

                // Pattern D: {folder}/movie.mp4 or video.mp4
                candidates.push(`${base}/${encFolder}/movie.mp4`);
                candidates.push(`${base}/${encFolder}/video.mp4`);
            }
        }

        // 2. FALLBACK: Flat root target https://zetware.id/storage/movies/file
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
                candidates: candidates.slice(0, 60),
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

/**
 * Cookie and Session Storage Helpers for Zetware Cloud Default Server Preference
 */
export const ZETWARE_DEFAULT_COOKIE = 'ztv_zetware_default';
export const ZETWARE_DEFAULT_STORAGE = 'ztv_zetware_default';

export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, days = 365): void {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function isZetwareDefaultEnabled(): boolean {
    if (typeof window === 'undefined') return false;

    // 1. Check Cookie
    const cookieVal = getCookie(ZETWARE_DEFAULT_COOKIE);
    if (cookieVal !== null) {
        return cookieVal === 'true';
    }

    // 2. Check Session Storage
    try {
        const sessionVal = sessionStorage.getItem(ZETWARE_DEFAULT_STORAGE);
        if (sessionVal !== null) {
            return sessionVal === 'true';
        }
    } catch {}

    // 3. Check Local Storage
    try {
        const localVal = localStorage.getItem(ZETWARE_DEFAULT_STORAGE);
        if (localVal !== null) {
            return localVal === 'true';
        }
    } catch {}

    return false; // Default: non-aktif
}

export function setZetwareDefaultEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    const valStr = enabled ? 'true' : 'false';

    // 1. Store in Cookie (365 hari)
    setCookie(ZETWARE_DEFAULT_COOKIE, valStr, 365);

    // 2. Store in Session Storage & Local Storage
    try {
        sessionStorage.setItem(ZETWARE_DEFAULT_STORAGE, valStr);
        localStorage.setItem(ZETWARE_DEFAULT_STORAGE, valStr);
    } catch {}

    // 3. Dispatch event to keep all components in sync in real-time
    window.dispatchEvent(
        new CustomEvent('ztv:zetware-default-changed', {
            detail: { enabled },
        })
    );
}

