# 🎬 ZTV Stream - Platform Streaming Film & Serial TV Premium

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Inertia.js-3.0-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/TMDB_API-v3-01B4E4?style=for-the-badge&logo=the-movie-database&logoColor=white" alt="TMDB API" />
  <img src="https://img.shields.io/badge/Zetware_Cloud-Direct_Stream-8B5CF6?style=for-the-badge&logo=icloud&logoColor=white" alt="Zetware Cloud" />
</p>

**ZTV Stream** adalah web aplikasi streaming film dan serial TV modern berkinerja tinggi yang dibangun dengan fondasi **Laravel 12**, **Inertia.js**, **React 19**, dan **TypeScript**. 

Aplikasi ini menyajikan pengalaman menonton film setara platform streaming kelas dunia melalui integrasi katalog real-time **The Movie Database (TMDB) API**, pemutar video berbingkai (*framed multi-server video player*), penyimpanan pribadi **Zetware Cloud Direct MP4** dengan deteksi resolusi pintar (hingga 4K), subtitle multi-bahasa dengan pembersih format otomatis, serta opsi menonton fleksibel (halaman tonton bioskop mandiri atau modal instan).

---

## ✨ Fitur-Fitur Unggulan

### ☁️ 1. Integrasi Khusus Zetware Cloud (Direct MP4 Streaming)
- **High-Speed Direct Stream**: Streaming langsung file MP4 definisi tinggi dari server cloud pribadi (`zetware.id/storage/movies/`) tanpa iklan pihak ketiga.
- **Deteksi Resolusi Cerdas (Multi-Resolution Probing)**:
  - Otomatis memindai dan mengenali berbagai format resolusi berdasarkan dimensi pertama file: **4K (UHD)**, **1080p (FHD)**, **720p (HD)**, **480p (SD)**, **360p (SD)**, hingga **240p**.
  - Pilihan ganti resolusi (*quality selector*) yang mulus langsung di pemutar video.
- **Penyimpanan Lokal / Hostinger Scanner**:
  - Jika aplikasi di-host di lingkungan server yang sama dengan storage (misal Hostinger cPanel `domains/zetware.id/public_html/storage/movies`), sistem membaca direktori storage lokal secara instan tanpa jeda HTTP curl.
- **Indikator Ketersediaan Real-Time (`ZetwareGlowingBadge`)**:
  - Badge interaktif yang memberi tahu ketersediaan server cloud untuk judul yang sedang dipilih, opsi setel server default, serta notifikasi film cloud terbaru.

### 💬 2. Subtitle Engine Cerdas & Pembersih Format Otomatis
- **Pencarian Subtitle Multi-Bahasa**:
  - Terintegrasi dengan OpenSubtitles via Stremio API untuk film dan serial TV (berdasarkan season & episode).
  - Prioritas utama untuk **Bahasa Indonesia** dan **English**, lengkap dengan penomoran opsi alternatif.
- **Proxy & Sanitizer WebVTT (`/api/subtitles/vtt`)**:
  - Pembersihan otomatis karakter UTF-8 BOM.
  - Sanitasi tag lanjutan ASS/SSA seperti `{\lan8}`, `{\an8}`, tag posisi, dan pewarnaan font yang sering mengganggu tampilan browser.
  - Konversi instan dari format SRT ke format standar WebVTT dengan caching responsif (24 jam).

### 🖥️ 3. Pengalaman Menonton Fleksibel (Watch Page & In-Page Modal)
- **Halaman Tonton Bioskop (`/watch/{id}`)**:
  - Halaman penuh yang imersif dengan *Theater Mode* (Mode Bioskop), navigasi pintar (*Smart Back Navigation*), pemilihan episode interaktif, dan kontrol multi-server.
- **Modal Pemutar Video Instan (`VideoPlayerModal.tsx`)**:
  - Menonton langsung dari katalog beranda tanpa perlu memuat ulang halaman (*zero page-reload*).
- **Multi-Server Streaming Fallback (Streambert Engine)**:
  - Pilihan beralih server secara manual atau otomatis:
    - **Zetware Cloud MP4** *(Server Cepat Prioritas)*
    - **Vidsrc.to** *(Server Embed Utama)*
    - **Videasy.net**
    - **Vidking**
    - **2embed.cc**
    - **Autoembed.co**
  - Dilengkapi *Fallback Error UI* interaktif dan tombol **Muat Ulang Server** jika terjadi gangguan pemutaran.

### 🌐 4. Terjemahan Sinopsis Dinamis (ID / EN)
- Tombol alih bahasa instan pada halaman detail dan halaman tonton untuk menerjemahkan ringkasan/sinopsis konten dari Bahasa Inggris ke Bahasa Indonesia secara langsung.

### 🌟 5. Katalog Lengkap & Navigasi TMDB Live
- **Live TMDB Catalog**: Memuat film trending, serial populer, film berating tertinggi (*top-rated*), rilis terbaru, serta genre (Aksi, Petualangan, Komedi, Horor, Sci-Fi, Misteri, dll).
- **Top 10 Hari Ini di Indonesia**: Jajaran konten paling populer dengan tipografi nomor tebal bergradasi khas platform streaming premium.
- **Pencarian Real-Time (Live Search Modal)**: Cari film atau serial TV instan dengan input interaktif.
- **Daftar Saya (Watchlist)**: Simpan judul favorit ke penyimpanan lokal browser (*localStorage*) untuk ditonton kemudian.
- **Hero Spotlight Carousel**: Sorotan video/banner utama dengan pemutar trailer latar belakang, tombol kontrol suara, dan pintasan detail.

### 📱 6. Desain UI/UX Modern & Responsif
- **Dark Mode Sinematik**: Palet warna gelap elegan dengan efek *glassmorphism*, micro-animations, dan tata letak responsif untuk desktop, tablet, dan smartphone.
- **Animated Skeleton UI**: Efek loading skeleton yang halus saat mengambil data API.
- **Halaman Informasi Legal**: Termasuk Halaman Syarat Layanan (`/terms`), Kebijakan Privasi (`/privacy`), dan Kebijakan Cookie (`/cookies`).

---

## 🛠️ Arsitektur & Teknologi

| Kategori | Teknologi |
| :--- | :--- |
| **Backend** | [Laravel 12](https://laravel.com/) (PHP >= 8.3), [Inertia.js v3](https://inertiajs.com/) |
| **Frontend** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), `@tailwindcss/vite`, [Lucide React Icons](https://lucide.dev/) |
| **Build & Tooling** | [Vite 8](https://vitejs.dev/) / Vite-Plus (`vp`), [Laravel Wayfinder](https://github.com/laravel/wayfinder) |
| **External APIs** | [The Movie Database (TMDB) API v3](https://www.themoviedb.org/), OpenSubtitles / Stremio API |
| **Cloud Storage** | Direct MP4 Storage Server (Zetware Cloud) |

---

## 📁 Struktur Direktori Proyek

```text
ztv/
├── app/
│   └── Http/Controllers/        # Controller Laravel & Inertia Responses
├── resources/
│   ├── js/
│   │   ├── components/
│   │   │   └── streaming/
│   │   │       ├── Navbar.tsx             # Navigasi utama, kategori, & modal live search
│   │   │       ├── HeroSpotlight.tsx      # Carousel hero banner film unggulan
│   │   │       ├── Top10Row.tsx           # Baris carousel Top 10 Hari Ini di Indonesia
│   │   │       ├── MovieRow.tsx           # Baris carousel kategori & genre film
│   │   │       ├── MovieCard.tsx          # Kartu poster media dengan efek hover & aksi cepat
│   │   │       ├── MovieDetailModal.tsx   # Modal rincian film, trailer, & daftar episode
│   │   │       ├── VideoPlayerModal.tsx   # Modal pemutar video multi-server & subtitle
│   │   │       ├── ZetwareGlowingBadge.tsx# Badge status & resolusi server Zetware Cloud
│   │   │       ├── CategoryPillFilter.tsx # Filter pil genre & kategori
│   │   │       ├── StreamingSkeleton.tsx  # Animasi skeleton screen saat pemuatan data
│   │   │       └── StreamingFooter.tsx    # Footer aplikasi streaming
│   │   ├── lib/
│   │   │   ├── tmdbService.ts             # Service pemanggilan TMDB API v3
│   │   │   ├── zetwareStorage.ts          # Utilitas pencarian & resolusi media Zetware Cloud
│   │   │   ├── subtitleService.ts         # Service pemanggilan API subtitle
│   │   │   ├── streambertApi.ts           # URL generator provider multi-embed
│   │   │   └── i18n.tsx                   # Service kamus & terjemahan teks sinopsis
│   │   ├── pages/
│   │   │   ├── welcome.tsx                # Halaman utama (beranda katalog streaming)
│   │   │   ├── detail.tsx                 # Halaman detail rincian film/serial
│   │   │   ├── watch.tsx                  # Halaman pemutar video bioskop (theater page)
│   │   │   ├── terms.tsx                  # Halaman Syarat & Ketentuan
│   │   │   ├── privacy.tsx                # Halaman Kebijakan Privasi
│   │   │   └── cookies.tsx                # Halaman Kebijakan Cookie
│   │   └── types/                         # Definisi TypeScript (MediaItem, Episode, dll)
│   └── css/                               # Entry point CSS Tailwind
└── routes/
    └── web.php                            # Routing web Inertia & API endpoints internal
```

---

## 🔌 Rute Web & API Internal

| Rute / Endpoint | Metode | Deskripsi |
| :--- | :---: | :--- |
| `/` | `GET` | Halaman beranda katalog ZTV Stream (`welcome.tsx`) |
| `/detail/{id}` | `GET` | Halaman detail rincian lengkap film atau serial (`detail.tsx`) |
| `/watch/{id}` | `GET` | Halaman tonton bioskop mandiri dengan parameter `?season=X&episode=Y` (`watch.tsx`) |
| `/terms` | `GET` | Halaman Syarat & Ketentuan Layanan |
| `/privacy` | `GET` | Halaman Kebijakan Privasi |
| `/cookies` | `GET` | Halaman Kebijakan Penggunaan Cookie |
| `/api/check-zetware-media` | `GET`/`POST` | Memeriksa ketersediaan file MP4 dan variasi resolusi di Zetware Cloud |
| `/api/subtitles` | `GET` | Mencari daftar subtitle multi-bahasa via TMDB/IMDb ID |
| `/api/subtitles/vtt` | `GET` | Proxy dan pembersih format subtitle SRT/VTT (sanitasi ASS tag `{\lan8}`) |

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### **Prasyarat Sistem**
- **PHP** `>= 8.3` dengan ekstensi `curl`, `mbstring`, `fileinfo`, `openssl`, `pdo_sqlite` atau `pdo_mysql`
- **Composer** `>= 2.x`
- **Node.js** `>= 18.x` & **NPM**

---

### **Langkah Setup Lokal**

1. **Kloning Repository**
   ```bash
   git clone https://github.com/username/ztv.git
   cd ztv
   ```

2. **Instal Dependensi Backend (PHP)**
   ```bash
   composer install
   ```

3. **Instal Dependensi Frontend (JavaScript)**
   ```bash
   npm install
   ```

4. **Konfigurasi Environment (`.env`)**
   Salin contoh file environment dan generate application key:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

   *Pastikan API Key TMDB sudah diatur di file `.env` (atau menggunakan token bawaan):*
   ```env
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
   TMDB_READ_TOKEN=your_tmdb_read_access_token_here
   ```

5. **Jalankan Aplikasi Lokal**
   
   **Opsi 1: Menjalankan Sekaligus (Rekomendasi)**
   ```bash
   composer run dev
   ```
   *(Perintah ini akan menjalankan server PHP artisan dan Vite compiler secara bersamaan).*

   **Opsi 2: Menjalankan di Terminal Terpisah**
   - **Terminal 1 (Backend Server):**
     ```bash
     php artisan serve
     ```
   - **Terminal 2 (Frontend Compiler):**
     ```bash
     npm run dev
     ```

6. **Buka Browser**
   Akses aplikasi di: [http://localhost:8000](http://localhost:8000) atau [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

## 📦 Kompilasi Produksi (Production Build)

Untuk membangun bundel frontend yang siap di-deploy ke server produksi:

```bash
npm run build
```

Untuk memverifikasi tipe TypeScript:
```bash
npm run types:check
```

---

## 🛡️ Kebijakan Hak Cipta & Penafian (Disclaimer)

- **ZTV Stream** tidak menyimpan atau mengunggah konten video berhak cipta pihak ketiga secara ilegal di server aplikasi ini.
- Semua data metadata (poster, judul, sinopsis, skor rilis) bersumber dari **The Movie Database (TMDB) API**.
- Penyedia embed video streaming merupakan layanan pihak ketiga yang tersedia secara publik di internet.

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT License](LICENSE).
