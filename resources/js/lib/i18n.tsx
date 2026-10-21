import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';

export type Language = 'id' | 'en';

export const translations = {
    id: {
        // Navbar
        nav_home: 'Beranda',
        nav_movies: 'Film',
        nav_series: 'Series TV',
        nav_originals: 'ZTV Originals',
        nav_my_list: 'Daftar Saya',
        nav_search_placeholder: 'Cari judul film, serial, genre...',
        nav_sign_in: 'Masuk / Daftar',

        // Hero Spotlight
        hero_play: 'Putar',
        hero_my_list: 'Daftar Saya',
        hero_saved: 'Tersimpan',
        hero_more_info: 'Info Selengkapnya',
        hero_rating: 'IMDb',

        // Category Filter Pills
        cat_all: 'Semua',
        cat_movies: 'Film',
        cat_series: 'Series TV',
        cat_originals: 'ZTV Originals',

        // Home Rows
        row_continue: 'Lanjutkan Menonton',
        row_top10: 'Top 10 Hari Ini di Indonesia',
        row_trending: 'Sedang Populer & Trending (TMDB Live)',
        row_action: 'Aksi Seru & Sci-Fi Masa Depan',
        row_horror: 'Misteri & Horor Menegangkan',

        // Video Player Modal
        player_server: 'Server',
        player_episodes: 'Musim & Episode',
        player_subtitles: 'Subtitle / Teks',
        player_close: 'Tutup',
        player_connecting: 'Menghubungkan Server Streambert...',

        // Movie Detail & Synopsis
        synopsis_title: 'Sinopsis',
        cast_title: 'Pemeran Utama',
        director_title: 'Sutradara',
        genre_title: 'Genre',
        episodes_title: 'Daftar Episode',
        play_movie: 'Putar Film',
        close_modal: 'Tutup',

        // Footer
        footer_devices_title: 'Tonton di Mana Saja, Kapan Saja',
        footer_devices_desc:
            'Tersedia di Smart TV, Ponsel, Tablet, Laptop, dan Konsol Game.',
        footer_terms_title: 'Ketentuan & Privasi',
        footer_terms_link: 'Syarat & Ketentuan Layanan',
        footer_privacy_link: 'Kebijakan Privasi',
        footer_cookie_link: 'Preferensi Cookie',
        footer_lang_title: 'BAHASA',
        footer_copyright: 'ZTV @ 2026 part of zetware.id',
    },
    en: {
        // Navbar
        nav_home: 'Home',
        nav_movies: 'Movies',
        nav_series: 'TV Series',
        nav_originals: 'ZTV Originals',
        nav_my_list: 'My List',
        nav_search_placeholder: 'Search movies, series, genres...',
        nav_sign_in: 'Sign In / Register',

        // Hero Spotlight
        hero_play: 'Watch Now',
        hero_my_list: 'My List',
        hero_saved: 'Saved',
        hero_more_info: 'More Info',
        hero_rating: 'IMDb',

        // Category Filter Pills
        cat_all: 'All',
        cat_movies: 'Movies',
        cat_series: 'TV Series',
        cat_originals: 'ZTV Originals',

        // Home Rows
        row_continue: 'Continue Watching',
        row_top10: 'Top 10 Movies Today',
        row_trending: 'Trending Now (TMDB Live)',
        row_action: 'Action & Sci-Fi Blockbusters',
        row_horror: 'Thriller & Horror Movies',

        // Video Player Modal
        player_server: 'Server',
        player_episodes: 'Seasons & Episodes',
        player_subtitles: 'Subtitles',
        player_close: 'Close',
        player_connecting: 'Connecting to Streaming Server...',

        // Movie Detail & Synopsis
        synopsis_title: 'Synopsis',
        cast_title: 'Starring',
        director_title: 'Director',
        genre_title: 'Genres',
        episodes_title: 'Episodes List',
        play_movie: 'Play Movie',
        close_modal: 'Close',

        // Footer
        footer_devices_title: 'Watch Anywhere, Anytime',
        footer_devices_desc:
            'Available on Smart TVs, Phones, Tablets, Laptops, and Game Consoles.',
        footer_terms_title: 'Terms & Privacy',
        footer_terms_link: 'Terms of Service',
        footer_privacy_link: 'Privacy Policy',
        footer_cookie_link: 'Cookie Preferences',
        footer_lang_title: 'LANGUAGE',
        footer_copyright: 'ZTV @ 2026 part of zetware.id',
    },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations.id) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'id',
    setLanguage: () => {},
    t: (key) => translations.id[key] || key,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [language, setLanguageState] = useState<Language>('id');

    useEffect(() => {
        const savedLang = localStorage.getItem('ztv_lang') as Language;
        if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
            setLanguageState(savedLang);
        } else {
            setLanguageState('id');
            localStorage.setItem('ztv_lang', 'id');
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('ztv_lang', lang);
    };

    const t = (key: keyof typeof translations.id): string => {
        return translations[language][key] || translations.id[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
