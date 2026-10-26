<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZetwareResolution extends Model
{
    protected $table = 'zetware_resolutions';

    protected $fillable = [
        'value',
        'raw_suffix',
        'badge',
        'label',
        'width',
        'height',
        'aspect_ratio',
        'notes',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'width' => 'integer',
        'height' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Daftarkan atau temukan resolusi di database.
     * Menerima format seperti:
     * - '1920x1038'
     * - '_1920x1038'
     * - '1080p'
     * - '_1080p'
     * - '4K'
     */
    public static function registerResolution(string $resolution, ?string $notes = null): self
    {
        $cleanRes = trim($resolution);
        if ($cleanRes === '') {
            $rawSuffix = '';
            $value = '';
        } else {
            $rawSuffix = str_starts_with($cleanRes, '_') ? $cleanRes : "_{$cleanRes}";
            $value = ltrim($cleanRes, '_');
        }

        $existing = static::where('value', $value)
            ->orWhere('raw_suffix', $rawSuffix)
            ->first();

        if ($existing) {
            if ($notes && empty($existing->notes)) {
                $existing->update(['notes' => $notes]);
            }
            return $existing;
        }

        // Hitung metadata resolusi
        $width = null;
        $height = null;
        $aspectRatio = null;
        $badge = $value ?: 'MP4';
        $label = $value ?: 'Direct MP4';

        if (preg_match('/^(\d+)x(\d+)$/i', $value, $m)) {
            $width = (int) $m[1];
            $height = (int) $m[2];
            if ($height > 0) {
                $ratio = round($width / $height, 2);
                $aspectRatio = "{$ratio}:1";
            }
        } elseif (preg_match('/(\d+)/', $value, $m)) {
            $firstNum = (int) $m[1];
            if ($firstNum >= 1000) {
                $width = $firstNum;
            } else {
                $height = $firstNum;
            }
        }

        $firstNum = $width ?? $height;
        $is4k = (stripos($value, '4k') !== false) || ($firstNum !== null && ($firstNum >= 3840 || $firstNum === 2160));

        if ($is4k) {
            $badge = '4K';
            $label = '4K (UHD)';
        } elseif ($firstNum !== null) {
            if ($firstNum === 1920 || $firstNum === 1080 || ($firstNum >= 1400 && $firstNum < 3840)) {
                $badge = '1080p';
                $label = '1080p (FHD)';
            } elseif ($firstNum === 1280 || $firstNum === 720 || ($firstNum >= 1000 && $firstNum < 1400)) {
                $badge = '720p';
                $label = '720p (HD)';
            } elseif ($firstNum === 854 || $firstNum === 960 || $firstNum === 480 || ($firstNum >= 700 && $firstNum < 1000)) {
                $badge = '480p';
                $label = '480p (SD)';
            } elseif ($firstNum === 640 || $firstNum === 360 || ($firstNum >= 300 && $firstNum < 700)) {
                $badge = '360p';
                $label = '360p (SD)';
            } elseif ($firstNum < 300) {
                $badge = '240p';
                $label = '240p (SD)';
            }
        }

        $sortOrder = $width ?: ($height ? $height * 2 : 0);

        return static::create([
            'value' => $value,
            'raw_suffix' => $rawSuffix,
            'badge' => $badge,
            'label' => $label,
            'width' => $width,
            'height' => $height,
            'aspect_ratio' => $aspectRatio,
            'notes' => $notes,
            'is_active' => true,
            'sort_order' => $sortOrder,
        ]);
    }

    /**
     * Dapatkan semua raw suffix aktif yang diurutkan dari resolusi tertinggi.
     * Mengembalikan array seperti: ['_1920x1038', '_1280x692', ...]
     */
    public static function getAllSuffixes(): array
    {
        return static::where('is_active', true)
            ->orderBy('sort_order', 'desc')
            ->pluck('raw_suffix')
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }
}
