import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Cookie,
    Shield,
    Lock,
    Check,
    Zap,
    Save,
    RefreshCw,
    Info,
} from 'lucide-react';
import StreamingFooter from '@/components/streaming/StreamingFooter';

export default function CookiesPage() {
    // Cookie preference state
    const [performanceCookies, setPerformanceCookies] = useState(true);
    const [functionalCookies, setFunctionalCookies] = useState(true);
    const [marketingCookies, setMarketingCookies] = useState(false);

    // Save notification banner state
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSavePreferences = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
            setTimeout(() => {
                setIsSaved(false);
            }, 4000);
        }, 500);
    };

    const handleAcceptAll = () => {
        setPerformanceCookies(true);
        setFunctionalCookies(true);
        setMarketingCookies(true);
        handleSavePreferences();
    };

    const handleRejectNonEssential = () => {
        setPerformanceCookies(false);
        setFunctionalCookies(false);
        setMarketingCookies(false);
        handleSavePreferences();
    };

    return (
        <div className="flex min-h-screen flex-col justify-between bg-slate-950 font-sans text-slate-100 selection:bg-red-600 selection:text-white">
            <Head title="Preferensi Cookie - ZTV Stream" />

            {/* Header Navigation */}
            <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <Link href="/" className="group flex items-center gap-2">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 shadow-lg shadow-red-600/30 transition-transform duration-300 group-hover:scale-105">
                            <span className="text-xl font-black tracking-wider text-white">
                                Z
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-extrabold tracking-tighter text-white">
                                ZTV{' '}
                                <span className="rounded border border-red-500/50 bg-red-600/30 px-1.5 py-0.5 text-xs font-semibold text-red-400">
                                    STREAM
                                </span>
                            </span>
                        </div>
                    </Link>

                    <Link
                        href="/"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:text-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Kembali ke Beranda</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                {/* Save Toast Feedback */}
                {isSaved && (
                    <div className="fixed right-6 bottom-6 z-50 flex animate-in items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-600 px-5 py-3.5 text-white shadow-2xl shadow-emerald-600/40 duration-300 slide-in-from-bottom-5">
                        <Check className="h-5 w-5 font-bold" />
                        <span className="text-sm font-bold">
                            Preferensi cookie Anda berhasil disimpan!
                        </span>
                    </div>
                )}

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-2xl sm:p-10">
                    <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-amber-600/10 blur-3xl" />

                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-600/20 px-3 py-1 text-xs font-bold tracking-wider text-amber-400 uppercase">
                            <Cookie className="h-3.5 w-3.5" />
                            Pusat Kontrol Privasi Browser
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Pengaturan & Preferensi Cookie
                        </h1>
                        <p className="text-sm leading-relaxed text-slate-400 sm:text-base">
                            ZTV Stream menggunakan cookie dan teknologi serupa
                            untuk mengingat sesi login Anda, mengoptimalkan
                            pemutaran video, dan memberikan rekomendasi film
                            yang relevan. Anda memiliki kontrol penuh atas jenis
                            cookie yang diaktifkan.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                                onClick={handleAcceptAll}
                                className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 sm:text-sm"
                            >
                                Terma Semua Cookie
                            </button>
                            <button
                                onClick={handleRejectNonEssential}
                                className="cursor-pointer rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/15 sm:text-sm"
                            >
                                Tolak Cookie Opsional
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cookie Categories Toggles */}
                <div className="space-y-4">
                    <h2 className="text-lg text-xs font-bold tracking-wide text-slate-400 text-white uppercase">
                        Kategori Cookie
                    </h2>

                    {/* 1. Essential Cookies (Locked) */}
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-slate-800 p-2.5 text-slate-300">
                                    <Lock className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="flex items-center gap-2 text-base font-bold text-white">
                                        Cookie Esensial & Diperlukan
                                        <span className="rounded border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400 uppercase">
                                            Selalu Aktif
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Wajib untuk fungsi dasar situs &
                                        otentikasi login pengguna.
                                    </p>
                                </div>
                            </div>

                            {/* Static Toggle Locked */}
                            <div className="flex h-7 w-12 cursor-not-allowed items-center justify-end rounded-full bg-red-600/40 p-1 opacity-70">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md">
                                    <Lock className="h-3 w-3 text-slate-900" />
                                </div>
                            </div>
                        </div>
                        <p className="border-t border-white/5 pt-2 text-xs leading-relaxed text-slate-400">
                            Cookie ini sangat penting agar aplikasi ZTV Stream
                            dapat berjalan secara aman. Ini mencakup penyimpanan
                            token autentikasi login, sesi aktif, serta
                            preferensi bahasa.
                        </p>
                    </div>

                    {/* 2. Performance & Analytics Cookies */}
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-slate-800 p-2.5 text-cyan-400">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">
                                        Cookie Performa & Analitik
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Membantu meningkatkan kecepatan
                                        pemutaran video & pengujian sistem.
                                    </p>
                                </div>
                            </div>

                            {/* Interactive Switch */}
                            <button
                                onClick={() =>
                                    setPerformanceCookies(!performanceCookies)
                                }
                                className={`h-7 w-12 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out ${
                                    performanceCookies
                                        ? 'bg-red-600'
                                        : 'border border-white/10 bg-slate-800'
                                }`}
                                aria-label="Toggle Performance Cookies"
                            >
                                <div
                                    className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                                        performanceCookies
                                            ? 'translate-x-5'
                                            : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                        <p className="border-t border-white/5 pt-2 text-xs leading-relaxed text-slate-400">
                            Cookie ini mengumpulkan data statistik anonim
                            tentang bagaimana pengunjung bernavigasi di ZTV
                            Stream, kecepatan pemuatan video 4K/FHD, serta
                            mendeteksi pemutusan sambungan jaringan.
                        </p>
                    </div>

                    {/* 3. Functional Cookies */}
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-slate-800 p-2.5 text-emerald-400">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">
                                        Cookie Fungsionalitas & Pengalaman
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Menyimpan setelan volume video,
                                        subtitle, & progres tontonan.
                                    </p>
                                </div>
                            </div>

                            {/* Interactive Switch */}
                            <button
                                onClick={() =>
                                    setFunctionalCookies(!functionalCookies)
                                }
                                className={`h-7 w-12 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out ${
                                    functionalCookies
                                        ? 'bg-red-600'
                                        : 'border border-white/10 bg-slate-800'
                                }`}
                                aria-label="Toggle Functional Cookies"
                            >
                                <div
                                    className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                                        functionalCookies
                                            ? 'translate-x-5'
                                            : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                        <p className="border-t border-white/5 pt-2 text-xs leading-relaxed text-slate-400">
                            Memungkinkan situs untuk mengingat pilihan
                            kustomisasi yang Anda buat, seperti volume suara
                            pemutar video, ukuran teks subtitle, dan film yang
                            Anda simpan di Daftar Saya.
                        </p>
                    </div>

                    {/* 4. Marketing Cookies */}
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-slate-800 p-2.5 text-purple-400">
                                    <Cookie className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">
                                        Cookie Pemasaran & Penargetan
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Menampilkan promosi tayangan sinema yang
                                        relevan dengan minat Anda.
                                    </p>
                                </div>
                            </div>

                            {/* Interactive Switch */}
                            <button
                                onClick={() =>
                                    setMarketingCookies(!marketingCookies)
                                }
                                className={`h-7 w-12 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out ${
                                    marketingCookies
                                        ? 'bg-red-600'
                                        : 'border border-white/10 bg-slate-800'
                                }`}
                                aria-label="Toggle Marketing Cookies"
                            >
                                <div
                                    className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                                        marketingCookies
                                            ? 'translate-x-5'
                                            : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                        <p className="border-t border-white/5 pt-2 text-xs leading-relaxed text-slate-400">
                            Digunakan untuk menyajikan rekomendasi judul film
                            terbaru atau promo perpanjangan langganan yang
                            dipersonalisasi di platform atau saluran mitra
                            resmi.
                        </p>
                    </div>
                </div>

                {/* Save Controls Footer Bar */}
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 to-slate-950 p-5 sm:flex-row">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Info className="h-4 w-4 shrink-0 text-cyan-400" />
                        <span>
                            Anda dapat mengubah preferensi cookie ini kapan saja
                            dari menu footer ZTV Stream.
                        </span>
                    </div>

                    <button
                        onClick={handleSavePreferences}
                        disabled={isSaving}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:from-red-500 hover:to-rose-500 disabled:opacity-50 sm:w-auto"
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span>Simpan Preferensi Cookie</span>
                            </>
                        )}
                    </button>
                </div>
            </main>

            <StreamingFooter />
        </div>
    );
}
