<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ZetwareCloudMediaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            [
                'tmdb_id' => 1368337,
                'title' => 'The Odyssey',
                'type' => 'movie',
                'folder_name' => 'THE ODYSSEY',
                'tag' => 'Epic / Adventure',
                'badge' => '4K / 1080p',
                'description' => 'Film bioskop resolusi penuh 4K & Full HD.',
                'release_date' => '2026',
                'is_active' => true,
            ],
            [
                'tmdb_id' => 1236045,
                'title' => 'Animals',
                'type' => 'movie',
                'folder_name' => 'ANIMALS',
                'tag' => 'Drama / Action',
                'badge' => '1080p Scope',
                'description' => 'Direct MP4 resolusi 1920 scope.',
                'release_date' => '2026',
                'is_active' => true,
            ],
            [
                'tmdb_id' => 1058424,
                'title' => 'Hope',
                'type' => 'movie',
                'folder_name' => 'HOPE',
                'tag' => 'Drama / Sci-Fi',
                'badge' => '1080p FHD',
                'description' => 'Direct MP4 high bitrate tanpa iklan.',
                'release_date' => '2026',
                'is_active' => true,
            ],
            [
                'tmdb_id' => 95350,
                'title' => 'Lanterns',
                'type' => 'series',
                'season' => 1,
                'episode' => 2,
                'folder_name' => 'LANTERNS',
                'tag' => 'Superhero / Mystery',
                'badge' => 'S1E2 1080p',
                'description' => 'Serial TV S1E2 resolusi 1920x960.',
                'release_date' => '2026',
                'is_active' => true,
            ],
            [
                'tmdb_id' => 969681,
                'title' => 'Spider-Man Brand New Day',
                'type' => 'movie',
                'folder_name' => 'SPIDER-MAN BRAND NEW DAY',
                'tag' => 'Action / Sci-Fi',
                'badge' => '1080p FHD',
                'description' => 'Koleksi superhero format MP4 langsung.',
                'release_date' => '2026',
                'is_active' => true,
            ],
            [
                'tmdb_id' => 1291595,
                'title' => 'Insidious Out of the Further',
                'type' => 'movie',
                'folder_name' => 'INSIDIOUS OUT OF THE FURTHER',
                'tag' => 'Horror / Mystery',
                'badge' => '1080p FHD',
                'description' => 'Audio surround definisi tinggi.',
                'release_date' => '2026',
                'is_active' => true,
            ],
            [
                'tmdb_id' => 1148365,
                'title' => 'Matchbox The Movie',
                'type' => 'movie',
                'folder_name' => 'MATCHBOX THE MOVIE',
                'tag' => 'Animation / Family',
                'badge' => '1080p FHD',
                'description' => 'Animasi jernih kualitas tinggi.',
                'release_date' => '2026',
                'is_active' => true,
            ],
            [
                'tmdb_id' => 26612,
                'title' => 'Treasure Island',
                'type' => 'movie',
                'folder_name' => 'TREASURE ISLAND',
                'tag' => 'Classic / Adventure',
                'badge' => '1080p FHD',
                'description' => 'Koleksi petualangan klasik.',
                'release_date' => '1950',
                'is_active' => true,
            ],
        ];

        foreach ($items as $data) {
            \App\Models\ZetwareCloudMedia::updateOrCreate(
                [
                    'tmdb_id' => $data['tmdb_id'],
                    'type' => $data['type'],
                    'season' => $data['season'] ?? null,
                    'episode' => $data['episode'] ?? null,
                ],
                $data
            );
        }
    }
}
