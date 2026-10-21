export interface Episode {
    id: string;
    episodeNumber: number;
    title: string;
    duration: string;
    thumbnail: string;
    synopsis: string;
}

export interface MediaItem {
    id: string;
    tmdbId?: number | string;
    title: string;
    type: 'movie' | 'series';
    rating: string;
    matchScore: string;
    year: number;
    ageRating: 'SU' | '13+' | '16+' | '18+';
    duration: string;
    quality: '4K Ultra HD' | 'HD' | 'Dolby Vision';
    genres: string[];
    synopsis: string;
    synopsisEn?: string;
    cast: string[];
    director: string;
    posterUrl: string;
    backdropUrl: string;
    videoUrl: string;
    isOriginal?: boolean;
    isTrending?: boolean;
    top10Rank?: number;
    progress?: number; // percentage 0-100 for continue watching
    episodes?: Episode[];
}

export const FALLBACK_MOVIES: MediaItem[] = [
    {
        id: 'tmdb-mov-550',
        tmdbId: 550,
        title: 'FIGHT CLUB',
        type: 'movie',
        rating: '8.8',
        matchScore: '98% Cocok',
        year: 1999,
        ageRating: '18+',
        duration: '2j 19m',
        quality: '4K Ultra HD',
        genres: ['Drama', 'Kriminal'],
        synopsis:
            'Seorang pekerja kantor yang menderita insomnia bertemu dengan pembuat sabun yang tak kenal takut. Bersama-sama mereka mendirikan klub pertarungan bawah tanah yang berkembang menjadi gerakan tak terkendali.',
        synopsisEn:
            'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
        cast: ['Brad Pitt', 'Edward Norton', 'Helena Bonham Carter'],
        director: 'David Fincher',
        posterUrl:
            'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        backdropUrl:
            'https://image.tmdb.org/t/p/w1280/hZkgoQY85KGivToF05RmRtxzvuU.jpg',
        videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        isOriginal: true,
        isTrending: true,
        top10Rank: 1,
    },
    {
        id: 'tmdb-mov-157336',
        tmdbId: 157336,
        title: 'INTERSTELLAR',
        type: 'movie',
        rating: '8.7',
        matchScore: '99% Cocok',
        year: 2014,
        ageRating: '13+',
        duration: '2j 49m',
        quality: '4K Ultra HD',
        genres: ['Aksi & Sci-Fi', 'Petualangan'],
        synopsis:
            'Ketika Bumi tak lagi mampu menopang kehidupan, sekelompok penjelajah antariksa menembus lubang cacing di luar angkasa untuk menemukan planet baru tempat tinggal umat manusia.',
        synopsisEn:
            'When Earth becomes uninhabitable, a team of ex-NASA pilots travels through a wormhole near Saturn in search of a new home for humanity.',
        cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
        director: 'Christopher Nolan',
        posterUrl:
            'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBv9B.jpg',
        backdropUrl:
            'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsX2P.jpg',
        videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        isOriginal: true,
        isTrending: true,
        top10Rank: 2,
    },
    {
        id: 'tmdb-mov-27205',
        tmdbId: 27205,
        title: 'INCEPTION',
        type: 'movie',
        rating: '8.8',
        matchScore: '97% Cocok',
        year: 2010,
        ageRating: '13+',
        duration: '2j 28m',
        quality: '4K Ultra HD',
        genres: ['Aksi & Sci-Fi', 'Petualangan'],
        synopsis:
            'Seorang pencuri ulung yang mencuri rahasia berharga dari dalam mimpi bawah sadar orang lain diberikan kesempatan untuk menghapus masa lalunya dengan melakukan tugas yang tampak mustahil.',
        synopsisEn:
            'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
        director: 'Christopher Nolan',
        posterUrl:
            'https://image.tmdb.org/t/p/w500/oYuLEydvwwbGcl2hETwv9M2W9fG.jpg',
        backdropUrl:
            'https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAuKQ.jpg',
        videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        isTrending: true,
        top10Rank: 3,
    },
    {
        id: 'tmdb-mov-299536',
        tmdbId: 299536,
        title: 'AVENGERS: INFINITY WAR',
        type: 'movie',
        rating: '8.3',
        matchScore: '96% Cocok',
        year: 2018,
        ageRating: '13+',
        duration: '2j 29m',
        quality: '4K Ultra HD',
        genres: ['Aksi & Sci-Fi', 'Petualangan'],
        synopsis:
            'Para pahlawan Avengers dan sekutu mereka harus bersatu untuk menghentikan Thanos sebelum dia mengumpulkan seluruh Infinity Stones dan memusnahkan separuh kehidupan di alam semesta.',
        synopsisEn:
            'The Avengers and their allies must be willing to sacrifice all in an attempt to defeat the powerful Thanos before his blitz of devastation and ruin puts an end to the universe.',
        cast: ['Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'],
        director: 'Anthony Russo, Joe Russo',
        posterUrl:
            'https://image.tmdb.org/t/p/w500/7WsyChLLEzFiDOVTGDRtq3P4cYD.jpg',
        backdropUrl:
            'https://image.tmdb.org/t/p/w1280/bOGkgRGdhrBYJSLivpEBxW8xSp.jpg',
        videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        isTrending: true,
        top10Rank: 4,
    },
    {
        id: 'tmdb-mov-475557',
        tmdbId: 475557,
        title: 'JOKER',
        type: 'movie',
        rating: '8.2',
        matchScore: '94% Cocok',
        year: 2019,
        ageRating: '18+',
        duration: '2j 2m',
        quality: '4K Ultra HD',
        genres: ['Drama', 'Kriminal'],
        synopsis:
            'Arthur Fleck, seorang komedian gagal yang diabaikan dan terisolasi dari masyarakat, perlahan tenggelam dalam kegilaan dan menjadi kriminal legendaris di Kota Gotham.',
        synopsisEn:
            'During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City while becoming an infamous counter-cultural figure.',
        cast: ['Joaquin Phoenix', 'Robert De Niro', 'Zazie Beetz'],
        director: 'Todd Phillips',
        posterUrl:
            'https://image.tmdb.org/t/p/w500/udDclSub2M1JLuC3zvgvtBmy3G7.jpg',
        backdropUrl:
            'https://image.tmdb.org/t/p/w1280/n6bToFSub2M1JLuC3zvgvtBmy3G7.jpg',
        videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        isTrending: true,
        top10Rank: 5,
    },
    {
        id: 'tmdb-tv-1399',
        tmdbId: 1399,
        title: 'GAME OF THRONES',
        type: 'series',
        rating: '8.4',
        matchScore: '95% Cocok',
        year: 2011,
        ageRating: '18+',
        duration: '8 Musim (73 Episode)',
        quality: '4K Ultra HD',
        genres: ['Drama', 'Petualangan & Fantasi'],
        synopsis:
            'Beberapa keluarga bangsawan bertarung memperebutkan Iron Throne dan kendali atas benua Westeros, saat ancaman kuno bangkit kembali dari utara.',
        synopsisEn:
            'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
        cast: ['Emilia Clarke', 'Kit Harington', 'Peter Dinklage'],
        director: 'David Benioff',
        posterUrl:
            'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1ee1u0.jpg',
        backdropUrl:
            'https://image.tmdb.org/t/p/w1280/2OMG0YKAwKCio12vG26Y26y1v.jpg',
        videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        isOriginal: true,
        isTrending: true,
        top10Rank: 6,
        episodes: [
            {
                id: 'ep-1-1399',
                episodeNumber: 1,
                title: 'Eps 1: Winter Is Coming',
                duration: '62m',
                thumbnail:
                    'https://image.tmdb.org/t/p/w1280/2OMG0YKAwKCio12vG26Y26y1v.jpg',
                synopsis:
                    'Lord Eddard Stark is warned by his king that an ancient threat approaches from the north.',
            },
            {
                id: 'ep-2-1399',
                episodeNumber: 2,
                title: 'Eps 2: The Kingsroad',
                duration: '56m',
                thumbnail:
                    'https://image.tmdb.org/t/p/w1280/2OMG0YKAwKCio12vG26Y26y1v.jpg',
                synopsis: 'The Starks depart Winterfell for King’s Landing.',
            },
        ],
    },
    {
        id: 'tmdb-tv-66732',
        tmdbId: 66732,
        title: 'STRANGER THINGS',
        type: 'series',
        rating: '8.6',
        matchScore: '98% Cocok',
        year: 2016,
        ageRating: '16+',
        duration: '4 Musim (34 Episode)',
        quality: '4K Ultra HD',
        genres: ['Horor & Misteri', 'Aksi & Sci-Fi'],
        synopsis:
            'Saat seorang anak laki-laki hilang secara misterius, sebuah kota kecil mengungkap rahasia laboratorium rahasia, eksperimen supernatural, dan seorang gadis kecil aneh.',
        synopsisEn:
            'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
        cast: ['Millie Bobby Brown', 'Finn Wolfhard', 'Winona Ryder'],
        director: 'The Duffer Brothers',
        posterUrl:
            'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn88qMG4dSc.jpg',
        backdropUrl:
            'https://image.tmdb.org/t/p/w1280/56v2Kj2E52v2Kj2E52v2Kj2E52v.jpg',
        videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        isOriginal: true,
        isTrending: true,
        top10Rank: 7,
        episodes: [
            {
                id: 'ep-1-66732',
                episodeNumber: 1,
                title: 'Eps 1: Chapter One: The Vanishing of Will Byers',
                duration: '48m',
                thumbnail:
                    'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn88qMG4dSc.jpg',
                synopsis:
                    'A young boy vanishes on his way home from a friend’s house.',
            },
        ],
    },
];

export const FEATURED_MEDIA: MediaItem[] = FALLBACK_MOVIES.slice(0, 3);
export const ALL_MEDIA: MediaItem[] = FALLBACK_MOVIES;

export const GENRES = [
    'Semua',
    'Aksi & Sci-Fi',
    'Horor & Misteri',
    'Drama Indonesia',
    'Anime',
    'Komedi',
    'Petualangan',
];
