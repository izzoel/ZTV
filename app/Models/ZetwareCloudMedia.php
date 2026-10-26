<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZetwareCloudMedia extends Model
{
    protected $table = 'zetware_cloud_media';

    protected $fillable = [
        'tmdb_id',
        'title',
        'type',
        'season',
        'episode',
        'folder_name',
        'tag',
        'badge',
        'description',
        'poster_path',
        'backdrop_path',
        'vote_average',
        'release_date',
        'streams_data',
        'is_active',
    ];

    protected $casts = [
        'tmdb_id' => 'integer',
        'season' => 'integer',
        'episode' => 'integer',
        'vote_average' => 'float',
        'streams_data' => 'array',
        'is_active' => 'boolean',
    ];
}
