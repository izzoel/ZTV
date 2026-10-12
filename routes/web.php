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

Route::get('/api/check-zetware-media', function (\Illuminate\Http\Request $request) {
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
            if (preg_match('/_(\d+x\d+|\d+p)/i', $url, $m)) {
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
        if (preg_match('/(\d+)x(\d+)/', $a['resolution'], $ma)) {
            $numA = (int) $ma[1] * (int) $ma[2];
        } elseif (preg_match('/(\d+)p/', $a['resolution'], $ma)) {
            $numA = (int) $ma[1] * 1000;
        }
        if (preg_match('/(\d+)x(\d+)/', $b['resolution'], $mb)) {
            $numB = (int) $mb[1] * (int) $mb[2];
        } elseif (preg_match('/(\d+)p/', $b['resolution'], $mb)) {
            $numB = (int) $mb[1] * 1000;
        }
        return $numB <=> $numA;
    });

    return response()->json([
        'exists' => ! empty($streams),
        'url' => ! empty($streams) ? $streams[0]['url'] : null,
        'streams' => $streams,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
