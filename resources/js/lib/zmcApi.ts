import { getTmdbIdForMedia } from '@/lib/streambertApi';
import type { MediaItem } from '@/data/movies';

export interface ZmcTargetParams {
    tmdb_id: string;
    m3u8_url: string;
    title: string;
    enable_download: string;
    test_download: string;
    threads: string;
}

export interface ZmcSendResponse {
    success: boolean;
    message: string;
    status?: number;
    target_url?: string;
    data?: unknown;
}

/**
 * Build target query parameters for a given media item (compatible with Target API)
 */
export function buildZmcParams(
    item: MediaItem,
    options?: {
        season?: number;
        episode?: number;
        targetM3u8Type?: 'watch' | 'stream' | 'zetware';
        directUrl?: string;
    },
): ZmcTargetParams {
    const tmdbId = String(
        item.tmdbId || getTmdbIdForMedia(item.id, item.tmdbId) || '27205',
    );

    const domain =
        typeof window !== 'undefined' &&
        !window.location.origin.includes('localhost')
            ? window.location.origin
            : 'https://cinema.zetware.id';

    const mediaId = item.id.startsWith('tmdb-')
        ? item.id
        : `tmdb-${item.type === 'series' ? 'tv' : 'mov'}-${tmdbId}`;

    const season = options?.season || 1;
    const episode = options?.episode || 1;
    const query =
        item.type === 'series' ? `?episode=${episode}&season=${season}` : '';
    const watchUrl = `${domain}/watch/${mediaId}${query}`;

    // Determine target m3u8 / stream URL
    let targetM3u8 = options?.directUrl || item.videoUrl || '';
    if (!targetM3u8 || options?.targetM3u8Type === 'watch') {
        targetM3u8 = watchUrl;
    }

    const title =
        item.type === 'series'
            ? `${item.title.toUpperCase()} - S${season}E${episode}`
            : item.title.toUpperCase();

    return {
        tmdb_id: tmdbId,
        m3u8_url: targetM3u8,
        title,
        enable_download: 'true',
        test_download: 'false',
        threads: '16',
    };
}

/**
 * Get base extract API endpoint from localStorage or default
 */
export function getZmcBaseUrl(): string {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('ztv_api_target_base_url');
            if (saved && saved.trim()) return saved.trim();
        } catch {
            // ignore
        }
    }
    return 'http://100.81.252.14:8000/extract';
}

/**
 * Send target API extraction request to backend for a media item
 */
export async function sendZmcRequest(
    item: MediaItem,
    options?: {
        season?: number;
        episode?: number;
        directUrl?: string;
        customBaseUrl?: string;
    },
): Promise<ZmcSendResponse> {
    const params = buildZmcParams(item, {
        season: options?.season,
        episode: options?.episode,
        directUrl: options?.directUrl,
    });

    const baseUrl = options?.customBaseUrl || getZmcBaseUrl();

    try {
        // Send via Laravel backend proxy to avoid mixed content & CORS errors
        const res = await fetch('/api/zmc/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                ...params,
                base_url: baseUrl,
            }),
        });

        if (res.ok) {
            const data = await res.json();
            return {
                success: !!data.success,
                message:
                    data.message ||
                    (data.success
                        ? 'Berhasil dikirim ke backend ZMC!'
                        : 'Backend gagal memproses permintaan.'),
                status: data.status || res.status,
                target_url: data.target_url,
                data: data.data,
            };
        }

        // If backend proxy returns error status, try direct fetch if not blocked
        const fallbackQuery = new URLSearchParams({
            ...params,
        }).toString();
        const directUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${fallbackQuery}`;

        return {
            success: false,
            message: `Gagal mengirim ke proxy backend (HTTP ${res.status})`,
            status: res.status,
            target_url: directUrl,
        };
    } catch {
        // Direct fetch attempt as network fallback
        try {
            const qs = new URLSearchParams({
                ...params,
            }).toString();
            const directUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${qs}`;
            const directRes = await fetch(directUrl, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            });

            return {
                success: directRes.ok,
                message: directRes.ok
                    ? `Berhasil terkirim via direct call! Status ${directRes.status}`
                    : `Direct call status: HTTP ${directRes.status}`,
                status: directRes.status,
                target_url: directUrl,
            };
        } catch (directErr: any) {
            return {
                success: false,
                message: `Koneksi ke backend gagal: ${directErr?.message || 'Server offline'}`,
                target_url: baseUrl,
            };
        }
    }
}
