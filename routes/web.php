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
    $rawCandidates = $request->input('candidates') ?? $request->query('candidates');
    if (is_array($rawCandidates)) {
        $candidates = $rawCandidates;
    } elseif (is_string($rawCandidates) && ! empty($rawCandidates)) {
        $candidates = explode(',', $rawCandidates);
    } else {
        $url = $request->input('url') ?? $request->query('url');
        if (is_string($url) && ! empty($url)) {
            $candidates = explode(',', $url);
        } else {
            $candidates = [];
        }
    }

    // Auto-generate candidates if title is provided
    $title = trim((string) ($request->input('title') ?? $request->query('title') ?? ''));
    $generatedCandidates = [];
    if (! empty($title)) {
        $type = (string) ($request->input('type') ?? $request->query('type') ?? 'movie');
        $season = (int) ($request->input('season') ?? $request->query('season') ?? 1);
        $episode = (int) ($request->input('episode') ?? $request->query('episode') ?? 1);

        // Prioritize resolutions matching actual files on Zetware Cloud
        $resolutions = [
            '_1920x800', '_1920x804', '_1920x1000', '_1920x960', '_1920x1080',
            '_1280x534', '_1280x536', '_1280x666', '_1280x640', '_1280x720',
            '_640x266', '_640x268', '_640x334', '_640x320', '_640x360',
            '_854x480', '_854x356', '_3840x2160',
            '_1080p', '_720p', '_480p', '_360p', '_4K', ''
        ];

        $bases = ['https://zetware.id/storage/movies', 'https://zetware.id/storage/movie'];

        $sanitizedTitle = trim(preg_replace('/[:\/\\\\?*"<>|]/', '', $title));
        $sanitizedTitleNormalized = trim(preg_replace('/\s+/', ' ', $sanitizedTitle));
        $upperTitle = strtoupper($sanitizedTitleNormalized);

        // Known storage folders on domains/zetware.id/public_html/storage/movies
        $knownCloudFolders = [
            'ANIMALS' => ['ANIMALS', 'ANIMAL'],
            'HOPE' => ['HOPE'],
            'INSIDIOUS OUT OF THE FURTHER' => ['INSIDIOUS OUT OF THE FURTHER', 'INSIDIOUS THE FURTHER', 'INSIDIOUS'],
            'LANTERNS' => ['LANTERNS', 'LANTERN'],
            'MATCHBOX THE MOVIE' => ['MATCHBOX THE MOVIE', 'MATCHBOX'],
            'SPIDER-MAN BRAND NEW DAY' => ['SPIDER-MAN BRAND NEW DAY', 'SPIDER MAN BRAND NEW DAY', 'BRAND NEW DAY'],
            'THE ODYSSEY' => ['THE ODYSSEY', 'ODYSSEY'],
            'TREASURE ISLAND' => ['TREASURE ISLAND'],
        ];

        $matchedCloudFolders = [];
        foreach ($knownCloudFolders as $cloudFolder => $aliases) {
            foreach ($aliases as $alias) {
                if ($upperTitle === $alias ||
                    stripos($upperTitle, $alias) !== false ||
                    stripos($alias, $upperTitle) !== false
                ) {
                    $matchedCloudFolders[] = $cloudFolder;
                    break;
                }
            }
        }

        // Generate folder variants with matched cloud folders prioritized first
        $folderVariants = array_values(array_unique(array_filter(array_merge(
            $matchedCloudFolders,
            [
                $upperTitle,
                strtoupper($sanitizedTitle),
                strtoupper($title),
                preg_replace('/^THE\s+/i', '', $upperTitle),
                'THE ' . preg_replace('/^THE\s+/i', '', $upperTitle),
                preg_replace('/\s+THE\s+MOVIE$/i', '', $upperTitle),
                preg_replace('/\s+MOVIE$/i', '', $upperTitle),
                $upperTitle . ' THE MOVIE',
                str_replace('-', ' ', $upperTitle),
                str_replace(' ', '-', $upperTitle),
                $sanitizedTitleNormalized,
                $sanitizedTitle,
                $title,
            ]
        ))));

        // Title variants for filenames
        $titleVariants = array_values(array_unique(array_filter(array_merge(
            $matchedCloudFolders,
            [
                $upperTitle,
                strtoupper($sanitizedTitle),
                strtoupper($title),
                preg_replace('/^THE\s+/i', '', $upperTitle),
                $sanitizedTitleNormalized,
                $sanitizedTitle,
                $title,
            ]
        ))));

        if ($type === 'series') {
            $epPatterns = array_values(array_unique([
                "S{$season}E{$episode}",
                sprintf('S%02dE%02d', $season, $episode),
            ]));

            foreach ($bases as $base) {
                foreach ($folderVariants as $folder) {
                    $encFolder = rawurlencode($folder);
                    foreach ($epPatterns as $ep) {
                        // Pattern 1: {folder} - {ep}{res}.mp4 (matches LANTERNS - S1E2_1920x960.mp4)
                        foreach ($resolutions as $res) {
                            $generatedCandidates[] = "$base/$encFolder/" . rawurlencode("{$folder} - {$ep}{$res}.mp4");
                        }
                        // Pattern 2: {titleVariant} - {ep}{res}.mp4
                        foreach ($titleVariants as $tv) {
                            if ($tv !== $folder) {
                                foreach ($resolutions as $res) {
                                    $generatedCandidates[] = "$base/$encFolder/" . rawurlencode("{$tv} - {$ep}{$res}.mp4");
                                }
                            }
                        }
                        // Pattern 3: {ep}{res}.mp4
                        foreach ($resolutions as $res) {
                            $generatedCandidates[] = "$base/$encFolder/" . rawurlencode("{$ep}{$res}.mp4");
                        }
                    }
                }
                foreach ($titleVariants as $tv) {
                    foreach ($epPatterns as $ep) {
                        foreach ($resolutions as $res) {
                            $generatedCandidates[] = "$base/" . rawurlencode("{$tv} - {$ep}{$res}.mp4");
                        }
                    }
                }
            }
        } else {
            foreach ($bases as $base) {
                foreach ($folderVariants as $folder) {
                    $encFolder = rawurlencode($folder);
                    // Primary pattern: {folder}/{folder}{res}.mp4 (e.g. HOPE/HOPE_1920x800.mp4)
                    foreach ($resolutions as $res) {
                        $generatedCandidates[] = "$base/$encFolder/" . rawurlencode("{$folder}{$res}.mp4");
                    }
                    // Secondary pattern: {folder}/{tv}{res}.mp4
                    foreach ($titleVariants as $tv) {
                        if ($tv !== $folder) {
                            foreach ($resolutions as $res) {
                                $generatedCandidates[] = "$base/$encFolder/" . rawurlencode("{$tv}{$res}.mp4");
                            }
                        }
                    }
                    foreach ($resolutions as $res) {
                        if ($res) {
                            $cleanRes = ltrim($res, '_');
                            $generatedCandidates[] = "$base/$encFolder/" . rawurlencode("{$cleanRes}.mp4");
                        }
                    }
                    $generatedCandidates[] = "$base/$encFolder/movie.mp4";
                    $generatedCandidates[] = "$base/$encFolder/video.mp4";
                }
                foreach ($titleVariants as $tv) {
                    foreach ($resolutions as $res) {
                        $generatedCandidates[] = "$base/" . rawurlencode("{$tv}{$res}.mp4");
                    }
                }
            }
        }
    }

    $allCandidates = array_values(array_unique(array_merge($generatedCandidates, $candidates)));

    $validCandidates = [];
    foreach ($allCandidates as $rawUrl) {
        if (is_string($rawUrl) && (
            str_starts_with($rawUrl, 'https://zetware.id/storage/movies/') ||
            str_starts_with($rawUrl, 'https://zetware.id/storage/movie/')
        )) {
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

    // Chunk checking into batches (16 URLs at a time) for speed and to avoid timeouts
    $batches = array_chunk($validCandidates, 16);
    $streams = [];

    foreach ($batches as $batchIndex => $batch) {
        $mh = curl_multi_init();
        $handles = [];
        foreach ($batch as $url) {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_NOBODY, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
            curl_setopt($ch, CURLOPT_TIMEOUT, 4);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'ZTV-Stream/1.0');
            curl_multi_add_handle($mh, $ch);
            $handles[$url] = $ch;
        }

        $active = null;
        do {
            $mrc = curl_multi_exec($mh, $active);
        } while ($mrc == CURLM_CALL_MULTI_PERFORM);

        while ($active && $mrc == CURLM_OK) {
            if (curl_multi_select($mh, 0.1) == -1) {
                usleep(10000);
            }
            do {
                $mrc = curl_multi_exec($mh, $active);
            } while ($mrc == CURLM_CALL_MULTI_PERFORM);
        }

        foreach ($handles as $url => $ch) {
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 400) {
                $res = 'Direct MP4';
                if (preg_match('/[_\/](\d+x\d+|\d+p|\d{3,4}|4k)(?:\.mp4)?/i', $url, $m)) {
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

        // Stop as soon as valid streams are found in the prioritized batch
        if (! empty($streams)) {
            break;
        }

        // Check up to 4 batches (64 prioritized URLs)
        if ($batchIndex >= 3) {
            break;
        }
    }

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

        if ($numB !== $numA) {
            return $numB <=> $numA;
        }

        // Prioritize subfolder URLs (more slashes after /storage/movies/)
        $depthA = substr_count($a['url'], '/');
        $depthB = substr_count($b['url'], '/');
        return $depthB <=> $depthA;
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
    $seenUrls = [];

    foreach ($rawSubtitles as $sub) {
        $downloadUrl = $sub['url'] ?? '';
        if (! $downloadUrl || isset($seenUrls[$downloadUrl])) {
            continue;
        }
        $seenUrls[$downloadUrl] = true;

        $langCode = strtolower($sub['lang'] ?? 'unknown');
        $standardCode = ($langCode === 'ind') ? 'id' : (($langCode === 'eng') ? 'en' : $langCode);
        $baseLabel = $langLabels[$langCode] ?? ucfirst($langCode);

        $vttProxyUrl = '/api/subtitles/vtt?url=' . urlencode($downloadUrl);

        $processed[] = [
            'id' => (string) ($sub['id'] ?? uniqid()),
            'lang' => $standardCode,
            'rawLang' => $langCode,
            'baseLabel' => $baseLabel,
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
        return strcmp($a['baseLabel'], $b['baseLabel']);
    });

    // Make labels unique per language so options and textTracks are unambiguous
    $langCount = [];
    foreach ($processed as &$item) {
        $code = $item['lang'];
        $langCount[$code] = ($langCount[$code] ?? 0) + 1;
        $item['label'] = ($langCount[$code] === 1)
            ? $item['baseLabel']
            : "{$item['baseLabel']} (Opsi {$langCount[$code]})";
        unset($item['baseLabel']);
    }
    unset($item);

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

Route::match(['get', 'post'], '/api/check-zetware-media', $checkZetwareMediaHandler);
Route::match(['get', 'post'], '/check-zetware-media', $checkZetwareMediaHandler);

Route::get('/api/subtitles', $subtitlesSearchHandler);
Route::get('/api/subtitles/vtt', $subtitlesVttProxyHandler);


Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
