import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ShieldCheck,
    Lock,
    Eye,
    Database,
    Share2,
    UserCheck,
    Clock,
    CheckCircle2,
} from 'lucide-react';
import StreamingFooter from '@/components/streaming/StreamingFooter';

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col justify-between bg-slate-950 font-sans text-slate-100 selection:bg-red-600 selection:text-white">
            <Head title="Kebijakan Privasi - ZTV Stream" />

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
            <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                {/* Hero Banner Header */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-2xl sm:p-10">
                    <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-600/10 blur-3xl" />

                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-600/20 px-3 py-1 text-xs font-bold tracking-wider text-emerald-400 uppercase">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Perlindungan Data Pribadi
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Kebijakan Privasi
                        </h1>
                        <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                            Di ZTV Stream, kami sangat menghargai dan
                            berkomitmen penuh untuk melindungi privasi serta
                            keamanan informasi pribadi pengguna kami. Kebijakan
                            ini menjelaskan bagaimana kami mengumpulkan,
                            menggunakan, dan melindungi data Anda.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 border-t border-white/5 pt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5 font-mono">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />{' '}
                                Terakhir diperbarui: 7 Oktober 2026
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                                <Lock className="h-3.5 w-3.5" /> Enkripsi
                                Kriptografi SSL 256-bit
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    {/* Quick Navigation Sidebar */}
                    <div className="sticky top-24 hidden h-fit space-y-2 text-xs md:col-span-1 md:block">
                        <p className="mb-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            Daftar Isi
                        </p>
                        <a
                            href="#pengumpulan"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            1. Informasi yang Dikuci
                        </a>
                        <a
                            href="#penggunaan"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            2. Penggunaan Informasi
                        </a>
                        <a
                            href="#keamanan"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            3. Keamanan Data
                        </a>
                        <a
                            href="#berbagi"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            4. Pembagian Data III
                        </a>
                        <a
                            href="#hak"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            5. Hak-Hak Pengguna
                        </a>
                    </div>

                    {/* Legal Body */}
                    <div className="space-y-8 text-sm leading-relaxed text-slate-300 sm:text-base md:col-span-3">
                        {/* Section 1 */}
                        <section
                            id="pengumpulan"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 font-bold text-emerald-400">
                                    <Database className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    1. Informasi yang Kami Kumpulkan
                                </h2>
                            </div>
                            <p>
                                Kami mengumpulkan beberapa kategori informasi
                                untuk menyediakan dan meningkatkan pengalaman
                                pemutaran streaming film yang lancar:
                            </p>
                            <ul className="space-y-2.5 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>
                                        <strong>Informasi Akun:</strong> Nama,
                                        alamat email, kata sandi terenkripsi,
                                        dan preferensi profil pengguna.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>
                                        <strong>Aktivitas Streaming:</strong>{' '}
                                        Riwayat film yang ditonton, durasi
                                        pemutaran, bookmark Daftar Saya, serta
                                        pencarian judul film.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>
                                        <strong>Informasi Perangkat:</strong>{' '}
                                        Jenis browser, alamat IP, jenis sistem
                                        operasi, resolusi layar, serta log
                                        kesalahan koneksi streaming.
                                    </span>
                                </li>
                            </ul>
                        </section>

                        {/* Section 2 */}
                        <section
                            id="penggunaan"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-600/20 font-bold text-cyan-400">
                                    <Eye className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    2. Cara Kami Menggunakan Informasi
                                </h2>
                            </div>
                            <p>
                                Informasi yang dikumpulkan digunakan semata-mata
                                untuk tujuan operasional berikut:
                            </p>
                            <ul className="list-inside list-disc space-y-2 pl-2 text-slate-300">
                                <li>
                                    Menyajikan rekomendasi film dan serial yang
                                    dipersonalisasi sesuai minat Anda.
                                </li>
                                <li>
                                    Menyimpan progres pemutaran film terakhir
                                    agar dapat dilanjutkan di berbagai
                                    perangkat.
                                </li>
                                <li>
                                    Mengirimkan notifikasi rilis film terbaru
                                    atau episode baru serial favorit Anda.
                                </li>
                                <li>
                                    Menganalisis performa server dan mencegah
                                    tindakan kecurangan atau penyalahgunaan
                                    akun.
                                </li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section
                            id="keamanan"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600/20 font-bold text-red-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    3. Keamanan & Enkripsi Data
                                </h2>
                            </div>
                            <p>
                                Kami mengimplementasikan standar keamanan
                                industri tingkat tinggi, termasuk enkripsi
                                Transport Layer Security (TLS/SSL) untuk seluruh
                                lalu lintas data antara perangkat Anda dan
                                server ZTV Stream.
                            </p>
                            <p>
                                Kata sandi akun disimpan menggunakan algoritma
                                hashing kuat yang tak dapat dibalikkan (Bcrypt),
                                sehingga tidak ada staf ZTV Stream yang dapat
                                membaca kata sandi mentah Anda.
                            </p>
                        </section>

                        {/* Section 4 */}
                        <section
                            id="berbagi"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 font-bold text-purple-400">
                                    <Share2 className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    4. Pembagian Informasi ke Pihak Ketiga
                                </h2>
                            </div>
                            <p>
                                ZTV Stream <strong>TIDAK PERNAH</strong>{' '}
                                menjual, menyewakan, atau memperdagangkan data
                                pribadi Anda kepada pihak mana pun untuk
                                keperluan pemasaran tanpa izin langsung dari
                                Anda.
                            </p>
                            <p>
                                Data hanya dapat dibagikan kepada penyedia
                                layanan terpercaya (seperti penyedia CDN
                                streaming video atau gateway pembayaran resmi)
                                secara terbatas demi menunjang operasional
                                aplikasi.
                            </p>
                        </section>

                        {/* Section 5 */}
                        <section
                            id="hak"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600/20 font-bold text-amber-400">
                                    <UserCheck className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    5. Hak-Hak Privasi Anda
                                </h2>
                            </div>
                            <p>
                                Sebagai pengguna, Anda memiliki hak penuh untuk:
                            </p>
                            <ul className="list-inside list-disc space-y-2 pl-2 text-slate-300">
                                <li>
                                    Mengakses dan memperbarui profil pribadi
                                    Anda kapan saja melalui Pengaturan Akun.
                                </li>
                                <li>
                                    Menghapus seluruh riwayat tontonan atau
                                    mengajukan penghapusan permanen akun Anda.
                                </li>
                                <li>
                                    Mengatur dan mengubah preferensi pelacakan
                                    cookie pada halaman Preferensi Cookie.
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>

            <StreamingFooter />
        </div>
    );
}
