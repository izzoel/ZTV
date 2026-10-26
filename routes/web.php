<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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

$checkZetwareMediaHandler = function (Request $request) {
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

    // Auto-generate candidates if title or tmdb_id is provided
    $title = trim((string) ($request->input('title') ?? $request->query('title') ?? ''));
    $tmdbId = trim((string) ($request->input('tmdb_id') ?? $request->query('tmdb_id') ?? ''));
    $type = (string) ($request->input('type') ?? $request->query('type') ?? 'movie');

    if (empty($title) && ! empty($tmdbId)) {
        $endpoint = ($type === 'series') ? "tv/{$tmdbId}" : "movie/{$tmdbId}";
        $token = (string) config('services.tmdb.read_token', 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZjNiOGQ3ZTAyZGViZjMzMDJkZTkyNzM2M2Y5MDVhNSIsIm5iZiI6MTc5MTMxNjg4Ny40MjUsInN1YiI6IjZhYzU1Mzk3N2ZhZGRlYzkyZGJiYzM2ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1QPNbFQVmR2xtf4vAh0Cb0I0XfuEM2uyQo0ksHE0NTs');
        $cacheKey = "tmdb_title_{$type}_{$tmdbId}";
        $title = Cache::remember($cacheKey, 86400, function () use ($endpoint, $token) {
            $ch = curl_init("https://api.themoviedb.org/3/{$endpoint}?language=en-US");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer {$token}",
                'Accept: application/json',
            ]);
            $res = curl_exec($ch);
            curl_close($ch);
            if (is_string($res)) {
                $d = json_decode($res, true);

                return (string) ($d['title'] ?? $d['name'] ?? $d['original_title'] ?? '');
            }

            return '';
        });
    }

    $generatedCandidates = [];
    $folderVariants = [];
    $epPatterns = [];
    if (! empty($title)) {
        $season = (int) ($request->input('season') ?? $request->query('season') ?? 1);
        $episode = (int) ($request->input('episode') ?? $request->query('episode') ?? 1);

        $resolutions = [
            '_1920x800', '_1920x802', '_1920x804', '_1920x806', '_1920x808', '_1920x810', '_1920x812', '_1920x816', '_1920x820',
            '_1920x960', '_1920x1000', '_1920x1080',
            '_1280x532', '_1280x534', '_1280x536', '_1280x538', '_1280x540', '_1280x542', '_1280x544',
            '_1280x640', '_1280x666', '_1280x720',
            '_640x264', '_640x266', '_640x268', '_640x270', '_640x272', '_640x320', '_640x334', '_640x360',
            '_854x356', '_854x358', '_854x360', '_854x480', '_960x480',
            '_3840x2160', '_3840x1600', '_3840x1604',
            '_1920', '_1280', '_960', '_854', '_640', '_3840',
            '_1080p', '_720p', '_480p', '_360p', '_4K', '',
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
                'THE '.preg_replace('/^THE\s+/i', '', $upperTitle),
                preg_replace('/\s+THE\s+MOVIE$/i', '', $upperTitle),
                preg_replace('/\s+MOVIE$/i', '', $upperTitle),
                $upperTitle.' THE MOVIE',
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
                    // 1. TMDB ID subfolder pattern (e.g. LANTERNS/95350/)
                    if (! empty($tmdbId)) {
                        $prefix = "$base/$encFolder/{$tmdbId}";
                        foreach ($epPatterns as $ep) {
                            foreach ($resolutions as $res) {
                                $generatedCandidates[] = "$prefix/".rawurlencode("{$folder} - {$ep}{$res}.mp4");
                            }
                            foreach ($resolutions as $res) {
                                $generatedCandidates[] = "$prefix/".rawurlencode("{$ep}{$res}.mp4");
                            }
                        }
                    } else {
                        // 2. Folder pattern HANYA jika tmdb_id tidak dioperasikan
                        foreach ($epPatterns as $ep) {
                            foreach ($resolutions as $res) {
                                $generatedCandidates[] = "$base/$encFolder/".rawurlencode("{$folder} - {$ep}{$res}.mp4");
                            }
                            foreach ($resolutions as $res) {
                                $generatedCandidates[] = "$base/$encFolder/".rawurlencode("{$ep}{$res}.mp4");
                            }
                        }
                    }
                }

                if (! empty($tmdbId)) {
                    $prefixDirect = "$base/{$tmdbId}";
                    foreach ($epPatterns as $ep) {
                        foreach ($resolutions as $res) {
                            $generatedCandidates[] = "$prefixDirect/".rawurlencode("{$ep}{$res}.mp4");
                        }
                    }
                }
            }
        } else {
            foreach ($bases as $base) {
                foreach ($folderVariants as $folder) {
                    $encFolder = rawurlencode($folder);
                    // 1. TMDB ID subfolder pattern (e.g. HOPE/1058424/)
                    if (! empty($tmdbId)) {
                        $prefix = "$base/$encFolder/{$tmdbId}";
                        foreach ($resolutions as $res) {
                            $generatedCandidates[] = "$prefix/".rawurlencode("{$folder}{$res}.mp4");
                        }
                        foreach ($resolutions as $res) {
                            if ($res) {
                                $cleanRes = ltrim($res, '_');
                                $generatedCandidates[] = "$prefix/".rawurlencode("{$cleanRes}.mp4");
                            }
                        }
                        $generatedCandidates[] = "$prefix/".rawurlencode("{$tmdbId}.mp4");
                        $generatedCandidates[] = "$prefix/movie.mp4";
                        $generatedCandidates[] = "$prefix/video.mp4";
                    } else {
                        // 2. Folder pattern HANYA jika tmdb_id tidak dioperasikan
                        foreach ($resolutions as $res) {
                            $generatedCandidates[] = "$base/$encFolder/".rawurlencode("{$folder}{$res}.mp4");
                        }
                        foreach ($resolutions as $res) {
                            if ($res) {
                                $cleanRes = ltrim($res, '_');
                                $generatedCandidates[] = "$base/$encFolder/".rawurlencode("{$cleanRes}.mp4");
                            }
                        }
                        $generatedCandidates[] = "$base/$encFolder/movie.mp4";
                        $generatedCandidates[] = "$base/$encFolder/video.mp4";
                    }
                }

                if (! empty($tmdbId)) {
                    $prefixDirect = "$base/{$tmdbId}";
                    foreach ($resolutions as $res) {
                        $generatedCandidates[] = "$prefixDirect/".rawurlencode("{$upperTitle}{$res}.mp4");
                    }
                    foreach ($resolutions as $res) {
                        if ($res) {
                            $cleanRes = ltrim($res, '_');
                            $generatedCandidates[] = "$prefixDirect/".rawurlencode("{$cleanRes}.mp4");
                        }
                    }
                    $generatedCandidates[] = "$prefixDirect/".rawurlencode("{$tmdbId}.mp4");
                    $generatedCandidates[] = "$prefixDirect/movie.mp4";
                    $generatedCandidates[] = "$prefixDirect/video.mp4";
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

    $streams = [];

    // 0. PRIMARY LOCAL STORAGE SCAN (HOSTINGER / CPANEL):
    // Jika aplikasi berjalan di server Hostinger yang sama dengan zetware.id (u834748983),
    // langsung baca direktori storage lokal agar 100% mendeteksi semua resolusi (seperti /storage/movies/HOPE/1058424/...)
    $possibleStorageDirs = [
        '/home/u834748983/domains/zetware.id/public_html/storage/movies',
        '/home/u834748983/domains/zetware.id/public_html/storage/movie',
        '/home/u834748983/public_html/storage/movies',
        public_path('storage/movies'),
        dirname(base_path()).'/domains/zetware.id/public_html/storage/movies',
        dirname(dirname(base_path())).'/domains/zetware.id/public_html/storage/movies',
        dirname(base_path()).'/zetware.id/public_html/storage/movies',
        dirname(dirname(base_path())).'/zetware.id/public_html/storage/movies',
    ];

    $localBaseDir = null;
    foreach ($possibleStorageDirs as $pDir) {
        if (is_dir($pDir)) {
            $localBaseDir = $pDir;
            break;
        }
    }

    if ($localBaseDir && (! empty($folderVariants) || ! empty($tmdbId))) {
        // Susun daftar direktori target yang akan diperiksa berdasarkan tmdb_id & nama folder
        $directoriesToScan = [];

        // 1. Jika tmdb_id ada, HANYA periksa direktori yang memiliki tmdb_id (contoh: /storage/movies/HOPE/1058424/ atau /storage/movies/1058424/)
        // Jika di direktori tidak ada folder tmdb_id nya, jangan fallback ke folder judul biasa agar badge tidak muncul
        if (! empty($tmdbId)) {
            foreach ($folderVariants as $folder) {
                $directoriesToScan[] = [
                    'path' => "$localBaseDir/$folder/$tmdbId",
                    'urlPrefix' => "https://zetware.id/storage/movies/".rawurlencode($folder)."/{$tmdbId}",
                ];
            }
            // Juga periksa langsung berdasarkan tmdb_id (contoh: /storage/movies/1058424/)
            $directoriesToScan[] = [
                'path' => "$localBaseDir/$tmdbId",
                'urlPrefix' => "https://zetware.id/storage/movies/{$tmdbId}",
            ];
        } else {
            // 2. Fallback HANYA jika tmdb_id memang tidak dioperasikan: Direktori folder judul biasa (contoh: /storage/movies/HOPE/)
            foreach ($folderVariants as $folder) {
                $directoriesToScan[] = [
                    'path' => "$localBaseDir/$folder",
                    'urlPrefix' => "https://zetware.id/storage/movies/".rawurlencode($folder),
                ];
            }
        }

        foreach ($directoriesToScan as $dirEntry) {
            $targetDirPath = $dirEntry['path'];
            $urlPrefix = $dirEntry['urlPrefix'];

            if (! is_dir($targetDirPath)) {
                continue;
            }

            $subPathsToScan = [
                ['fsPath' => $targetDirPath, 'urlPrefix' => $urlPrefix],
            ];

            // Jika series, periksa juga subfolder season (S1, Season 1, dll.)
            if ($type === 'series') {
                $seasonFolderNames = [
                    "S{$season}",
                    sprintf('S%02d', $season),
                    "Season {$season}",
                    sprintf('Season %02d', $season),
                ];
                foreach ($seasonFolderNames as $sfn) {
                    $sfsPath = "$targetDirPath/$sfn";
                    if (is_dir($sfsPath)) {
                        $subPathsToScan[] = [
                            'fsPath' => $sfsPath,
                            'urlPrefix' => "{$urlPrefix}/".rawurlencode($sfn),
                        ];
                    }
                }
            }

            foreach ($subPathsToScan as $subPath) {
                $curFsPath = $subPath['fsPath'];
                $curUrlPrefix = $subPath['urlPrefix'];
                $scanned = scandir($curFsPath);
                if ($scanned === false) {
                    continue;
                }

                foreach ($scanned as $fn) {
                    if (! str_ends_with(strtolower($fn), '.mp4')) {
                        continue;
                    }

                    if ($type === 'series') {
                        $matchEp = false;
                        foreach ($epPatterns as $ep) {
                            if (stripos($fn, $ep) !== false) {
                                $matchEp = true;
                                break;
                            }
                        }
                        if (! $matchEp) {
                            continue;
                        }
                    }

                    $res = 'Direct MP4';
                    if (preg_match('/_(\d+x\d+|\d+p|\d{3,4}|4k)(?:\.mp4)?$/i', $fn, $m)) {
                        $res = $m[1];
                    }

                    $encFn = rawurlencode($fn);
                    $streams[] = [
                        'url' => "{$curUrlPrefix}/{$encFn}",
                        'resolution' => $res,
                        'label' => $res,
                        'http_code' => 200,
                    ];
                }
            }

            if (! empty($streams)) {
                break;
            }
        }
    }

    // Jika belum ditemukan dari direktori lokal, lakukan probing via HTTP curl
    if (empty($streams)) {
        // Chunk checking into batches (16 URLs at a time) for speed and to avoid timeouts
        $batches = array_chunk($validCandidates, 16);

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
                    $urlFn = basename(rawurldecode($url));
                    if (preg_match('/_(\d+x\d+|\d+p|\d{3,4}|4k)(?:\.mp4)?$/i', $urlFn, $m)) {
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

            // Jika stream valid ditemukan, langsung lakukan targeted probe untuk semua varian resolusi file tersebut
            if (! empty($streams)) {
                // Dapatkan pattern prefix dari stream pertama yang ditemukan
                $firstUrl = $streams[0]['url'];
                $decodedFirstUrl = rawurldecode($firstUrl);
                $dirPath = dirname($firstUrl);
                $rawFileName = basename($decodedFirstUrl);
                // Ekstrak nama dasar file sebelum resolusi (misal: "THE ODYSSEY" dari "THE ODYSSEY_1280x666.mp4")
                $rawBaseName = preg_replace('/_(\d+x\d+|\d+p|\d{3,4}|4k)(?:\.mp4)?$/i', '', $rawFileName);
                $rawBaseName = preg_replace('/\.mp4$/i', '', $rawBaseName);

                if (! empty($rawBaseName)) {
                    $targetResList = [
                        '_1920x800', '_1920x802', '_1920x804', '_1920x806', '_1920x808', '_1920x810', '_1920x812', '_1920x816', '_1920x820',
                        '_1920x960', '_1920x1000', '_1920x1080',
                        '_1280x532', '_1280x534', '_1280x536', '_1280x538', '_1280x540', '_1280x542', '_1280x544',
                        '_1280x640', '_1280x666', '_1280x720',
                        '_640x264', '_640x266', '_640x268', '_640x270', '_640x272', '_640x320', '_640x334', '_640x360',
                        '_854x356', '_854x358', '_854x360', '_854x480', '_960x480',
                        '_3840x2160', '_3840x1600', '_3840x1604',
                        '_1920', '_1280', '_960', '_854', '_640', '_3840',
                        '_1080p', '_720p', '_480p', '_360p', '_4K', '_4k',
                    ];

                    $probeUrls = [];
                    $existingUrls = array_column($streams, 'url');

                    foreach ($targetResList as $tr) {
                        $testUrl = "$dirPath/".rawurlencode("{$rawBaseName}{$tr}.mp4");
                        if (! in_array($testUrl, $existingUrls)) {
                            $probeUrls[] = $testUrl;
                        }
                    }

                    if (! empty($probeUrls)) {
                        $pmh = curl_multi_init();
                        $pHandles = [];
                        foreach ($probeUrls as $pUrl) {
                            $pch = curl_init($pUrl);
                            curl_setopt($pch, CURLOPT_NOBODY, true);
                            curl_setopt($pch, CURLOPT_FOLLOWLOCATION, true);
                            curl_setopt($pch, CURLOPT_CONNECTTIMEOUT, 4);
                            curl_setopt($pch, CURLOPT_TIMEOUT, 7);
                            curl_setopt($pch, CURLOPT_SSL_VERIFYPEER, false);
                            curl_setopt($pch, CURLOPT_USERAGENT, 'ZTV-Stream/1.0');
                            curl_multi_add_handle($pmh, $pch);
                            $pHandles[$pUrl] = $pch;
                        }

                        $pActive = null;
                        do {
                            $pmrc = curl_multi_exec($pmh, $pActive);
                        } while ($pmrc == CURLM_CALL_MULTI_PERFORM);

                        while ($pActive && $pmrc == CURLM_OK) {
                            if (curl_multi_select($pmh, 0.1) == -1) {
                                usleep(10000);
                            }
                            do {
                                $pmrc = curl_multi_exec($pmh, $pActive);
                            } while ($pmrc == CURLM_CALL_MULTI_PERFORM);
                        }

                        foreach ($pHandles as $pUrl => $pch) {
                            $pCode = curl_getinfo($pch, CURLINFO_HTTP_CODE);
                            curl_multi_remove_handle($pmh, $pch);
                            curl_close($pch);

                            if ($pCode >= 200 && $pCode < 400) {
                                $pRes = 'Direct MP4';
                                $pFn = basename(rawurldecode($pUrl));
                                if (preg_match('/_(\d+x\d+|\d+p|\d{3,4}|4k)(?:\.mp4)?$/i', $pFn, $pm)) {
                                    $pRes = $pm[1];
                                }
                                $streams[] = [
                                    'url' => $pUrl,
                                    'resolution' => $pRes,
                                    'label' => $pRes,
                                    'http_code' => $pCode,
                                ];
                            }
                        }
                        curl_multi_close($pmh);
                    }
                }

                break;
            }

            // Check up to 8 batches (128 prioritized URLs)
            if ($batchIndex >= 7) {
                break;
            }
        }
    }

    // Deduplikasi stream berdasarkan resolusi dan URL
    $uniqueStreams = [];
    $seenKeys = [];
    foreach ($streams as $st) {
        $key = $st['resolution'].'_'.$st['url'];
        if (! isset($seenKeys[$key])) {
            $seenKeys[$key] = true;
            // Format label resolusi: hanya mencek angka resolusi pertama (misal: 640x268 -> hanya mencek 640 saja)
            $rawRes = $st['resolution'];
            $badge = $rawRes;
            $userLabel = $rawRes;

            $firstNum = null;
            if (preg_match('/(\d+)/', $rawRes, $numMatch)) {
                $firstNum = (int) $numMatch[1];
            }
            $is4k = (stripos($rawRes, '4k') !== false) || ($firstNum !== null && ($firstNum >= 3840 || $firstNum === 2160));

            if ($is4k) {
                $badge = '4K';
                $userLabel = '4K (UHD)';
            } elseif ($firstNum !== null) {
                // 1920 (FHD / 1080p)
                if ($firstNum === 1920 || $firstNum === 1080 || ($firstNum >= 1400 && $firstNum < 3840)) {
                    $badge = '1080p';
                    $userLabel = '1080p (FHD)';
                } elseif ($firstNum === 1280 || $firstNum === 720 || ($firstNum >= 1000 && $firstNum < 1400)) {
                    $badge = '720p';
                    $userLabel = '720p (HD)';
                } elseif ($firstNum === 854 || $firstNum === 960 || $firstNum === 480 || ($firstNum >= 700 && $firstNum < 1000)) {
                    $badge = '480p';
                    $userLabel = '480p (SD)';
                } elseif ($firstNum === 640 || $firstNum === 360 || ($firstNum >= 300 && $firstNum < 700)) {
                    $badge = '360p';
                    $userLabel = '360p (SD)';
                } elseif ($firstNum < 300) {
                    $badge = '240p';
                    $userLabel = '240p (SD)';
                }
            } elseif (preg_match('/1080p?/i', $rawRes)) {
                $badge = '1080p';
                $userLabel = '1080p (FHD)';
            } elseif (preg_match('/720p?/i', $rawRes)) {
                $badge = '720p';
                $userLabel = '720p (HD)';
            } elseif (preg_match('/480p?/i', $rawRes)) {
                $badge = '480p';
                $userLabel = '480p (SD)';
            } elseif (preg_match('/360p?/i', $rawRes)) {
                $badge = '360p';
                $userLabel = '360p (SD)';
            }

            $st['badge'] = $badge;
            $st['user_label'] = $userLabel;
            $uniqueStreams[] = $st;
        }
    }
    $streams = $uniqueStreams;

    usort($streams, function ($a, $b) {
        $firstNumA = 0;
        $firstNumB = 0;
        if (preg_match('/(\d+)/', $a['resolution'], $ma)) {
            $firstNumA = (int) $ma[1];
        } elseif (stripos($a['resolution'], '4k') !== false) {
            $firstNumA = 3840;
        }

        if (preg_match('/(\d+)/', $b['resolution'], $mb)) {
            $firstNumB = (int) $mb[1];
        } elseif (stripos($b['resolution'], '4k') !== false) {
            $firstNumB = 3840;
        }

        $mapWidth = function ($num) {
            if ($num === 1080) {
                return 1920;
            }
            if ($num === 720) {
                return 1280;
            }
            if ($num === 480) {
                return 854;
            }
            if ($num === 360) {
                return 640;
            }

            return $num;
        };

        $wA = $mapWidth($firstNumA);
        $wB = $mapWidth($firstNumB);

        if ($wB !== $wA) {
            return $wB <=> $wA;
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
        'title' => $title,
        'tmdb_id' => $tmdbId,
    ]);
};

$subtitlesSearchHandler = function (Request $request) {
    $tmdbId = $request->query('tmdb_id');
    $type = $request->query('type', 'movie');
    $season = (int) $request->query('season', 1);
    $episode = (int) $request->query('episode', 1);
    $imdbId = $request->query('imdb_id');

    if (! $tmdbId && ! $imdbId) {
        return response()->json(['success' => false, 'subtitles' => []]);
    }

    $token = (string) config('services.tmdb.read_token', 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZjNiOGQ3ZTAyZGViZjMzMDJkZTkyNzM2M2Y5MDVhNSIsIm5iZiI6MTc5MTMxNjg4Ny40MjUsInN1YiI6IjZhYzU1Mzk3N2ZhZGRlYzkyZGJiYzM2ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1QPNbFQVmR2xtf4vAh0Cb0I0XfuEM2uyQo0ksHE0NTs');

    // 1. Resolve IMDb ID from TMDB if not provided
    if (empty($imdbId)) {
        $cacheKey = "tmdb_imdb_{$type}_{$tmdbId}";
        $imdbId = Cache::remember($cacheKey, 604800, function () use ($tmdbId, $type, $token) {
            $endpoint = ($type === 'series' || $type === 'tv') ? 'tv' : 'movie';
            $ch = curl_init("https://api.themoviedb.org/3/{$endpoint}/{$tmdbId}/external_ids");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$token}"]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $res = curl_exec($ch);
            curl_close($ch);
            if (is_string($res)) {
                $data = json_decode($res, true);

                return is_array($data) ? ($data['imdb_id'] ?? null) : null;
            }

            return null;
        });
    }

    if (! $imdbId) {
        return response()->json(['success' => false, 'subtitles' => []]);
    }

    // 2. Query Subtitles via OpenSubtitles / Stremio API
    $cacheKeySubs = "subs_{$imdbId}_{$type}_{$season}_{$episode}";
    $rawSubtitles = Cache::remember($cacheKeySubs, 43200, function () use ($imdbId, $type, $season, $episode) {
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
        if (is_string($res)) {
            $data = json_decode($res, true);

            return is_array($data) ? ($data['subtitles'] ?? []) : [];
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

        $vttProxyUrl = '/api/subtitles/vtt?url='.urlencode($downloadUrl);

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
            if ($item['lang'] === 'id') {
                return 1;
            }
            if ($item['lang'] === 'en') {
                return 2;
            }

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

$subtitlesVttProxyHandler = function (Request $request) {
    $targetUrl = $request->query('url');
    if (! $targetUrl || ! filter_var($targetUrl, FILTER_VALIDATE_URL)) {
        return response("WEBVTT\n\n", 400, ['Content-Type' => 'text/vtt; charset=utf-8']);
    }

    $cacheKey = 'vtt_clean_'.md5($targetUrl);
    $vttContent = Cache::remember($cacheKey, 86400, function () use ($targetUrl) {
        $ch = curl_init($targetUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'ZTV-Stream/1.0');
        $raw = curl_exec($ch);
        curl_close($ch);

        if (! is_string($raw) || empty($raw)) {
            return "WEBVTT\n\n";
        }

        // Clean UTF-8 BOM
        $clean = preg_replace('/^\xEF\xBB\xBF/', '', $raw) ?? $raw;
        $clean = str_replace(["\r\n", "\r"], "\n", $clean);

        // Strip ASS/SSA tags like {\lan8}, {\an8}, {\pos(...)}, {\c&H...}, {\b1}, etc.
        $clean = preg_replace('/\{[^}\r\n]*\}/', '', $clean);
        // Strip residual font tags
        $clean = preg_replace('/<\/?font[^>]*>/i', '', $clean);

        // Check if already WebVTT
        if (str_starts_with(trim($clean), 'WEBVTT')) {
            return $clean;
        }

        // Convert SRT to WebVTT
        $converted = preg_replace('/(\d{2}:\d{2}:\d{2}),(\d{3})/', '$1.$2', $clean);

        return "WEBVTT\n\n".trim($converted)."\n";
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

$zmcSendHandler = function (Request $request) {
    $baseUrl = $request->input('base_url') ?? $request->query('base_url') ?? 'http://100.81.252.14:8000/extract';
    $tmdbId = (string) ($request->input('tmdb_id') ?? $request->query('tmdb_id') ?? '');
    $m3u8Url = (string) ($request->input('m3u8_url') ?? $request->query('m3u8_url') ?? '');
    $title = (string) ($request->input('title') ?? $request->query('title') ?? '');
    $enableDownload = (string) ($request->input('enable_download') ?? $request->query('enable_download') ?? 'true');
    $testDownload = (string) ($request->input('test_download') ?? $request->query('test_download') ?? 'false');
    $threads = (string) ($request->input('threads') ?? $request->query('threads') ?? '16');

    $params = [
        'tmdb_id' => $tmdbId,
        'm3u8_url' => $m3u8Url,
        'title' => $title,
        'enable_download' => $enableDownload,
        'test_download' => $testDownload,
        'threads' => $threads,
    ];

    $trimmed = trim((string) $baseUrl);
    if (empty($trimmed)) {
        $trimmed = 'http://100.81.252.14:8000/extract';
    }

    $query = http_build_query($params);
    $targetUrl = str_contains($trimmed, '?') ? "{$trimmed}&{$query}" : "{$trimmed}?{$query}";

    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error && empty($response)) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal menghubungi backend extract: '.$error,
            'target_url' => $targetUrl,
            'http_code' => $httpCode ?: 502,
        ], 200);
    }

    $decoded = json_decode((string) $response, true);

    return response()->json([
        'success' => ($httpCode >= 200 && $httpCode < 300),
        'status' => $httpCode,
        'message' => ($httpCode >= 200 && $httpCode < 300)
            ? 'Berhasil dikirim ke backend ZMC!'
            : "Backend respon HTTP {$httpCode}",
        'target_url' => $targetUrl,
        'data' => $decoded ?? $response,
    ]);
};

Route::match(['get', 'post'], '/api/zmc/send', $zmcSendHandler);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::get('dashboard/cloud-media', function () {
        $dbMedia = \App\Models\ZetwareCloudMedia::orderBy('created_at', 'asc')->get();

        return inertia('cloud-media', [
            'initialCloudMedia' => $dbMedia,
        ]);
    })->name('dashboard.cloud-media');
    Route::inertia('dashboard/database-media', 'database-media')->name('dashboard.database-media');

    // API manajemen media cloud (Create, Update, Delete)
    Route::post('/api/admin/cloud-media', function (Request $request) {
        $validated = $request->validate([
            'tmdb_id' => 'required|numeric',
            'title' => 'required|string|max:255',
            'type' => 'required|in:movie,series',
            'season' => 'nullable|integer',
            'episode' => 'nullable|integer',
            'folder_name' => 'nullable|string|max:255',
            'tag' => 'nullable|string|max:255',
            'badge' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'release_date' => 'nullable|string|max:50',
        ]);

        $media = \App\Models\ZetwareCloudMedia::updateOrCreate(
            [
                'tmdb_id' => $validated['tmdb_id'],
                'type' => $validated['type'],
                'season' => $validated['season'] ?? null,
                'episode' => $validated['episode'] ?? null,
            ],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Media berhasil disimpan ke database!',
            'data' => $media,
        ]);
    })->name('admin.cloud-media.store');

    Route::delete('/api/admin/cloud-media/{id}', function ($id) {
        $media = \App\Models\ZetwareCloudMedia::findOrFail($id);
        $media->delete();

        return response()->json([
            'success' => true,
            'message' => 'Media berhasil dihapus dari database.',
        ]);
    })->name('admin.cloud-media.destroy');

    // API Singkronisasi Direktori Zetware Cloud dengan Database MySQL
    Route::post('/api/admin/cloud-media/sync', function (Request $request) {
        $customTargets = $request->input('targets'); // Array opsional dari user: [{tmdb_id, title, folder, type, season, episode}]

        // Daftar direktori & TMDB ID yang diketahui ada di Zetware Cloud
        $cloudDirectories = [
            [
                'tmdb_id' => 1368337,
                'title' => 'The Odyssey',
                'folder_name' => 'THE ODYSSEY',
                'type' => 'movie',
                'tag' => 'Epic / Adventure',
                'badge' => '4K / 1080p',
                'description' => 'Film bioskop resolusi penuh 4K & Full HD di server cloud.',
                'release_date' => '2026',
            ],
            [
                'tmdb_id' => 1236045,
                'title' => 'Animals',
                'folder_name' => 'ANIMALS',
                'type' => 'movie',
                'tag' => 'Drama / Action',
                'badge' => '1080p Scope',
                'description' => 'Direct MP4 resolusi 1920 scope.',
                'release_date' => '2026',
            ],
            [
                'tmdb_id' => 1058424,
                'title' => 'Hope',
                'folder_name' => 'HOPE',
                'type' => 'movie',
                'tag' => 'Drama / Sci-Fi',
                'badge' => '1080p FHD',
                'description' => 'Direct MP4 high bitrate tanpa iklan.',
                'release_date' => '2026',
            ],
            [
                'tmdb_id' => 95350,
                'title' => 'Lanterns',
                'folder_name' => 'LANTERNS',
                'type' => 'series',
                'season' => 1,
                'episode' => 2,
                'tag' => 'Superhero / Mystery',
                'badge' => 'S1E2 1080p',
                'description' => 'Serial TV S1E2 resolusi 1920x960.',
                'release_date' => '2026',
            ],
            [
                'tmdb_id' => 969681,
                'title' => 'Spider-Man Brand New Day',
                'folder_name' => 'SPIDER-MAN BRAND NEW DAY',
                'type' => 'movie',
                'tag' => 'Action / Sci-Fi',
                'badge' => '1080p FHD',
                'description' => 'Koleksi superhero format MP4 langsung.',
                'release_date' => '2026',
            ],
            [
                'tmdb_id' => 1291595,
                'title' => 'Insidious Out of the Further',
                'folder_name' => 'INSIDIOUS OUT OF THE FURTHER',
                'type' => 'movie',
                'tag' => 'Horror / Mystery',
                'badge' => '1080p FHD',
                'description' => 'Audio surround definisi tinggi.',
                'release_date' => '2026',
            ],
            [
                'tmdb_id' => 1148365,
                'title' => 'Matchbox The Movie',
                'folder_name' => 'MATCHBOX THE MOVIE',
                'type' => 'movie',
                'tag' => 'Animation / Family',
                'badge' => '1080p FHD',
                'description' => 'Animasi jernih kualitas tinggi.',
                'release_date' => '2026',
            ],
            [
                'tmdb_id' => 26612,
                'title' => 'Treasure Island',
                'folder_name' => 'TREASURE ISLAND',
                'type' => 'movie',
                'tag' => 'Classic / Adventure',
                'badge' => '1080p FHD',
                'description' => 'Koleksi petualangan klasik.',
                'release_date' => '1950',
            ],
        ];

        // Jika user mengirimkan target tambahan, gabungkan
        if (is_array($customTargets) && ! empty($customTargets)) {
            foreach ($customTargets as $ct) {
                if (! empty($ct['tmdb_id'])) {
                    $cloudDirectories[] = [
                        'tmdb_id' => (int) $ct['tmdb_id'],
                        'title' => (string) ($ct['title'] ?? ('TMDB ' . $ct['tmdb_id'])),
                        'folder_name' => (string) ($ct['folder_name'] ?? strtoupper($ct['title'] ?? '')),
                        'type' => ($ct['type'] ?? 'movie') === 'series' ? 'series' : 'movie',
                        'season' => isset($ct['season']) ? (int) $ct['season'] : null,
                        'episode' => isset($ct['episode']) ? (int) $ct['episode'] : null,
                        'tag' => $ct['tag'] ?? null,
                        'badge' => $ct['badge'] ?? 'Cloud Direct',
                        'description' => $ct['description'] ?? null,
                        'release_date' => $ct['release_date'] ?? null,
                    ];
                }
            }
        }

        $token = (string) config('services.tmdb.read_token', 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZjNiOGQ3ZTAyZGViZjMzMDJkZTkyNzM2M2Y5MDVhNSIsIm5iZiI6MTc5MTMxNjg4Ny40MjUsInN1YiI6IjZhYzU1Mzk3N2ZhZGRlYzkyZGJiYzM2ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1QPNbFQVmR2xtf4vAh0Cb0I0XfuEM2uyQo0ksHE0NTs');

        $addedItems = [];
        $existingCount = 0;
        $totalChecked = count($cloudDirectories);

        foreach ($cloudDirectories as $dirItem) {
            $tmdbId = (int) $dirItem['tmdb_id'];
            $type = $dirItem['type'] ?? 'movie';
            $season = $dirItem['season'] ?? null;
            $episode = $dirItem['episode'] ?? null;

            // Cek apakah TMDB ID sudah ada di tabel database
            $existsInDb = \App\Models\ZetwareCloudMedia::where('tmdb_id', $tmdbId)
                ->where('type', $type)
                ->when($season !== null, fn ($q) => $q->where('season', $season))
                ->when($episode !== null, fn ($q) => $q->where('episode', $episode))
                ->exists();

            if ($existsInDb) {
                $existingCount++;
                continue;
            }

            // Jika belum ada di database, lengkapi metadata dari TMDB API jika perlu
            $title = $dirItem['title'] ?? '';
            $desc = $dirItem['description'] ?? '';
            $tag = $dirItem['tag'] ?? '';
            $poster = $dirItem['poster_path'] ?? null;
            $backdrop = $dirItem['backdrop_path'] ?? null;
            $voteAverage = $dirItem['vote_average'] ?? null;
            $releaseDate = $dirItem['release_date'] ?? null;

            if (empty($title) || empty($desc) || ! $poster) {
                try {
                    $endpoint = ($type === 'series' || $type === 'tv') ? "tv/{$tmdbId}" : "movie/{$tmdbId}";
                    $ch = curl_init("https://api.themoviedb.org/3/{$endpoint}?language=id-ID");
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$token}"]);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    $res = curl_exec($ch);
                    curl_close($ch);

                    if (is_string($res)) {
                        $tmdbData = json_decode($res, true);
                        if (is_array($tmdbData)) {
                            if (empty($title)) {
                                $title = $tmdbData['title'] ?? $tmdbData['name'] ?? "TMDB {$tmdbId}";
                            }
                            if (empty($desc) && ! empty($tmdbData['overview'])) {
                                $desc = $tmdbData['overview'];
                            }
                            if (empty($releaseDate)) {
                                $releaseDate = $tmdbData['release_date'] ?? $tmdbData['first_air_date'] ?? null;
                            }
                            if (! $poster && ! empty($tmdbData['poster_path'])) {
                                $poster = $tmdbData['poster_path'];
                            }
                            if (! $backdrop && ! empty($tmdbData['backdrop_path'])) {
                                $backdrop = $tmdbData['backdrop_path'];
                            }
                            if (! $voteAverage && isset($tmdbData['vote_average'])) {
                                $voteAverage = $tmdbData['vote_average'];
                            }
                            if (empty($tag) && ! empty($tmdbData['genres'])) {
                                $genreNames = array_slice(array_column($tmdbData['genres'], 'name'), 0, 2);
                                $tag = implode(' / ', $genreNames);
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    // Fallback to initial values
                }
            }

            // Simpan media baru ke database
            $created = \App\Models\ZetwareCloudMedia::create([
                'tmdb_id' => $tmdbId,
                'title' => $title ?: "TMDB {$tmdbId}",
                'type' => $type,
                'season' => $season,
                'episode' => $episode,
                'folder_name' => $dirItem['folder_name'] ?? strtoupper($title),
                'tag' => $tag ?: ($type === 'series' ? 'Serial TV' : 'Film Bioskop'),
                'badge' => $dirItem['badge'] ?? '1080p FHD',
                'description' => $desc ?: "Media dari Zetware Cloud TMDB ID {$tmdbId}",
                'poster_path' => $poster,
                'backdrop_path' => $backdrop,
                'vote_average' => $voteAverage,
                'release_date' => $releaseDate,
                'is_active' => true,
            ]);

            $addedItems[] = $created;
        }

        // Ambil data terbaru untuk frontend
        $allMedia = \App\Models\ZetwareCloudMedia::orderBy('created_at', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => count($addedItems) > 0
                ? 'Singkronisasi selesai: ' . count($addedItems) . ' media cloud baru berhasil ditambahkan ke database!'
                : 'Singkronisasi selesai: Semua direktori TMDB ID cloud sudah ada di database.',
            'added_count' => count($addedItems),
            'existing_count' => $existingCount,
            'total_checked' => $totalChecked,
            'added_items' => $addedItems,
            'all_media' => $allMedia,
        ]);
    })->name('admin.cloud-media.sync');
});

require __DIR__.'/settings.php';
