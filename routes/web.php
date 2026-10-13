<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/terms', 'terms')->name('terms');
Route::inertia('/privacy', 'privacy')->name('privacy');
Route::inertia('/cookies', 'cookies')->name('cookies');

Route::get('/detail/{id}', function ($id) {
    return inertia('detail', [
        'id' => $id,
    ]);
})->name('detail');

Route::get('/watch/{id}', function ($id) {
    return inertia('watch', [
        'id' => $id,
        'initialSeason' => (int) request()->query('season', 1),
        'initialEpisode' => (int) request()->query('episode', 1),
    ]);
})->name('watch');

$checkZetwareMediaHandler = function (\Illuminate\Http\Request $request) {
    $rawCandidates = $request->query('candidates');
    if (is_array($rawCandidates)) {
        $candidates = $rawCandidates;
    } elseif (is_string($rawCandidates) && ! empty($rawCandidates)) {
        $candidates = explode(',', $rawCandidates);
    } else {
        $url = $request->query('url');
        if (is_string($url) && ! empty($url)) {
            $candidates = explode(',', $url);
        } else {
            $candidates = [];
        }
    }

    $validCandidates = [];
    foreach ($candidates as $rawUrl) {
        if (is_string($rawUrl) && str_starts_with($rawUrl, 'https://zetware.id/storage/movies/')) {
            $validCandidates[] = $rawUrl;
        }
    }

    if (empty($validCandidates)) {
        return response()->json([
            'exists' => false,
            'url' => null,
            'streams' => [],
        ]);
    }

    $mh = curl_multi_init();
    $handles = [];
    foreach ($validCandidates as $url) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'ZTV-Stream/1.0');
        curl_multi_add_handle($mh, $ch);
        $handles[$url] = $ch;
    }

    $running = null;
    do {
        curl_multi_exec($mh, $running);
        curl_multi_select($mh);
    } while ($running > 0);

    $streams = [];
    foreach ($handles as $url => $ch) {
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 400) {
            $res = 'Direct MP4';
            if (preg_match('/_(\d+x\d+|\d+p|\d{3,4}|4k)/i', $url, $m)) {
                $res = $m[1];
            }

            $streams[] = [
                'url' => $url,
                'resolution' => $res,
                'label' => $res,
                'http_code' => $httpCode,
            ];
        }
    }
    curl_multi_close($mh);

    usort($streams, function ($a, $b) {
        $numA = 0;
        $numB = 0;
        if (preg_match('/(\d+)x(\d+)/i', $a['resolution'], $ma)) {
            $numA = (int) $ma[1] * (int) $ma[2];
        } elseif (preg_match('/(\d+)p?/i', $a['resolution'], $ma)) {
            $numA = (int) $ma[1] * 1000;
        } elseif (stripos($a['resolution'], '4k') !== false) {
            $numA = 4000 * 1000;
        }

        if (preg_match('/(\d+)x(\d+)/i', $b['resolution'], $mb)) {
            $numB = (int) $mb[1] * (int) $mb[2];
        } elseif (preg_match('/(\d+)p?/i', $b['resolution'], $mb)) {
            $numB = (int) $mb[1] * 1000;
        } elseif (stripos($b['resolution'], '4k') !== false) {
            $numB = 4000 * 1000;
        }

        return $numB <=> $numA;
    });

    return response()->json([
        'exists' => ! empty($streams),
        'url' => ! empty($streams) ? $streams[0]['url'] : null,
        'streams' => $streams,
    ]);
};

$subtitlesSearchHandler = function (\Illuminate\Http\Request $request) {
    $tmdbId = $request->query('tmdb_id');
    $type = $request->query('type', 'movie');
    $season = (int) $request->query('season', 1);
    $episode = (int) $request->query('episode', 1);
    $imdbId = $request->query('imdb_id');

    if (! $tmdbId && ! $imdbId) {
        return response()->json(['success' => false, 'subtitles' => []]);
    }

    $token = env('TMDB_READ_TOKEN', 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZjNiOGQ3ZTAyZGViZjMzMDJkZTkyNzM2M2Y5MDVhNSIsIm5iZiI6MTc5MTMxNjg4Ny40MjUsInN1YiI6IjZhYzU1Mzk3N2ZhZGRlYzkyZGJiYzM2ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1QPNbFQVmR2xtf4vAh0Cb0I0XfuEM2uyQo0ksHE0NTs');

    // 1. Resolve IMDb ID from TMDB if not provided
    if (! $imdbId && $tmdbId) {
        $cacheKey = "tmdb_imdb_{$type}_{$tmdbId}";
        $imdbId = \Illuminate\Support\Facades\Cache::remember($cacheKey, 604800, function () use ($tmdbId, $type, $token) {
            $endpoint = ($type === 'series' || $type === 'tv') ? 'tv' : 'movie';
            $ch = curl_init("https://api.themoviedb.org/3/{$endpoint}/{$tmdbId}/external_ids");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$token}"]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $res = curl_exec($ch);
            curl_close($ch);
            if ($res) {
                $data = json_decode($res, true);
                return $data['imdb_id'] ?? null;
            }
            return null;
        });
    }

    if (! $imdbId) {
        return response()->json(['success' => false, 'subtitles' => []]);
    }

    // 2. Query Subtitles via OpenSubtitles / Stremio API
    $cacheKeySubs = "subs_{$imdbId}_{$type}_{$season}_{$episode}";
    $rawSubtitles = \Illuminate\Support\Facades\Cache::remember($cacheKeySubs, 43200, function () use ($imdbId, $type, $season, $episode) {
        $url = ($type === 'series' || $type === 'tv')
            ? "https://opensubtitles-v3.strem.io/subtitles/series/{$imdbId}:{$season}:{$episode}.json"
            : "https://opensubtitles-v3.strem.io/subtitles/movie/{$imdbId}.json";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'ZTV-Stream/1.0');
        $res = curl_exec($ch);
        curl_close($ch);
        if ($res) {
            $data = json_decode($res, true);
            return $data['subtitles'] ?? [];
        }
        return [];
    });

    if (empty($rawSubtitles)) {
        return response()->json(['success' => true, 'imdb_id' => $imdbId, 'subtitles' => []]);
    }

    $langLabels = [
        'ind' => 'Bahasa Indonesia',
        'id' => 'Bahasa Indonesia',
        'eng' => 'English',
        'en' => 'English',
        'zho' => 'Mandarin',
        'chi' => 'Mandarin',
        'jpn' => 'Jepang',
        'kor' => 'Korea',
        'spa' => 'Spanyol',
        'fre' => 'Prancis',
        'fra' => 'Prancis',
        'ger' => 'Jerman',
        'deu' => 'Jerman',
        'ara' => 'Arab',
        'rus' => 'Rusia',
        'por' => 'Portugis',
        'pob' => 'Portugis (BR)',
        'tha' => 'Thailand',
        'vie' => 'Vietnam',
    ];

    $processed = [];
    foreach ($rawSubtitles as $sub) {
        $langCode = strtolower($sub['lang'] ?? 'unknown');
        $standardCode = ($langCode === 'ind') ? 'id' : (($langCode === 'eng') ? 'en' : $langCode);
        $label = $langLabels[$langCode] ?? ucfirst($langCode);

        $downloadUrl = $sub['url'] ?? '';
        if (! $downloadUrl) {
            continue;
        }

        $vttProxyUrl = '/api/subtitles/vtt?url=' . urlencode($downloadUrl);

        $processed[] = [
            'id' => (string) ($sub['id'] ?? uniqid()),
            'lang' => $standardCode,
            'rawLang' => $langCode,
            'label' => $label,
            'fileName' => $sub['subtitleFileName'] ?? '',
            'url' => $vttProxyUrl,
            'source' => 'OpenSubtitles',
            'isDefault' => false,
        ];
    }

    // Sort: Indonesian first, then English, then others
    usort($processed, function ($a, $b) {
        $priority = function ($item) {
            if ($item['lang'] === 'id') return 1;
            if ($item['lang'] === 'en') return 2;
            return 3;
        };
        $pA = $priority($a);
        $pB = $priority($b);
        if ($pA !== $pB) {
            return $pA <=> $pB;
        }
        return strcmp($a['label'], $b['label']);
    });

    // Mark the first Indonesian (or first available) as default
    if (! empty($processed)) {
        $hasIndo = false;
        foreach ($processed as &$item) {
            if ($item['lang'] === 'id') {
                $item['isDefault'] = true;
                $hasIndo = true;
                break;
            }
        }
        if (! $hasIndo) {
            $processed[0]['isDefault'] = true;
        }
    }

    return response()->json([
        'success' => true,
        'imdb_id' => $imdbId,
        'subtitles' => $processed,
    ]);
};

$subtitlesVttProxyHandler = function (\Illuminate\Http\Request $request) {
    $targetUrl = $request->query('url');
    if (! $targetUrl || ! filter_var($targetUrl, FILTER_VALIDATE_URL)) {
        return response("WEBVTT\n\n", 400, ['Content-Type' => 'text/vtt; charset=utf-8']);
    }

    $cacheKey = 'vtt_' . md5($targetUrl);
    $vttContent = \Illuminate\Support\Facades\Cache::remember($cacheKey, 86400, function () use ($targetUrl) {
        $ch = curl_init($targetUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'ZTV-Stream/1.0');
        $raw = curl_exec($ch);
        curl_close($ch);

        if (! $raw) {
            return "WEBVTT\n\n";
        }

        // Clean UTF-8 BOM
        $clean = preg_replace('/^\xEF\xBB\xBF/', '', $raw);
        $clean = str_replace(["\r\n", "\r"], "\n", $clean);

        // Check if already WebVTT
        if (str_starts_with(trim($clean), 'WEBVTT')) {
            return $clean;
        }

        // Convert SRT to WebVTT
        $converted = preg_replace('/(\d{2}:\d{2}:\d{2}),(\d{3})/', '$1.$2', $clean);

        return "WEBVTT\n\n" . trim($converted) . "\n";
    });

    return response($vttContent, 200, [
        'Content-Type' => 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin' => '*',
        'Cache-Control' => 'public, max-age=86400',
    ]);
};

Route::get('/api/check-zetware-media', $checkZetwareMediaHandler);
Route::get('/check-zetware-media', $checkZetwareMediaHandler);

Route::get('/api/subtitles', $subtitlesSearchHandler);
Route::get('/api/subtitles/vtt', $subtitlesVttProxyHandler);


Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
