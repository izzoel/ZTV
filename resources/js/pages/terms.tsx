import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    FileText,
    ShieldCheck,
    Scale,
    AlertCircle,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import StreamingFooter from '@/components/streaming/StreamingFooter';

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col justify-between bg-slate-950 font-sans text-slate-100 selection:bg-red-600 selection:text-white">
            <Head title="Syarat & Ketentuan Layanan - ZTV Stream" />

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
                    <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />

                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-600/20 px-3 py-1 text-xs font-bold tracking-wider text-red-400 uppercase">
                            <FileText className="h-3.5 w-3.5" />
                            Dokumen Legal Resmi
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Syarat & Ketentuan Layanan
                        </h1>
                        <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                            Harap baca Syarat dan Ketentuan ini secara saksama
                            sebelum menggunakan platform streaming ZTV Stream.
                            Ketentuan ini mengatur hak dan kewajiban Anda saat
                            menggunakan layanan kami.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 border-t border-white/5 pt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5 font-mono">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />{' '}
                                Terakhir diperbarui: 7 Oktober 2026
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5 font-mono">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />{' '}
                                Berlaku Efektif Seluruh Wilayah
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
                            href="#pendahuluan"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            1. Penerimaan Ketentuan
                        </a>
                        <a
                            href="#akun"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            2. Akun & Keanggotaan
                        </a>
                        <a
                            href="#streaming"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            3. Streaming & Lisensi
                        </a>
                        <a
                            href="#pembayaran"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            4. Langganan & Tagihan
                        </a>
                        <a
                            href="#larangan"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            5. Batasan & Larangan
                        </a>
                        <a
                            href="#hakcipta"
                            className="block rounded-xl px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            6. Hak Kekayaan Intelektual
                        </a>
                    </div>

                    {/* Legal Body */}
                    <div className="space-y-8 text-sm leading-relaxed text-slate-300 sm:text-base md:col-span-3">
                        {/* Section 1 */}
                        <section
                            id="pendahuluan"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600/20 font-bold text-red-400">
                                    1
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    Penerimaan Ketentuan Layanan
                                </h2>
                            </div>
                            <p>
                                Dengan mengakses, mendaftar, atau menggunakan
                                platform ZTV Stream, Anda menyatakan setuju
                                untuk terikat oleh Syarat dan Ketentuan Layanan
                                ini, Kebijakan Privasi kami, serta aturan
                                operasional lain yang dipublikasikan oleh ZTV
                                Stream.
                            </p>
                            <p>
                                Jika Anda tidak menyetujui salah satu bagian
                                dari ketentuan ini, Anda tidak diperkenankan
                                untuk mengakses atau menggunakan layanan ZTV
                                Stream dalam bentuk apa pun.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section
                            id="akun"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-600/20 font-bold text-rose-400">
                                    2
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    Akun dan Kelayakan Keanggotaan
                                </h2>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                    <span>
                                        <strong>Batas Usia:</strong> Anda harus
                                        berusia sekurang-kurangnya 18 tahun atau
                                        telah memiliki kewenangan hukum yang sah
                                        untuk menggunakan layanan ini.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                    <span>
                                        <strong>Keamanan Akun:</strong> Anda
                                        bertanggung jawab penuh untuk menjaga
                                        kerahasiaan kata sandi dan seluruh
                                        aktivitas yang terjadi di dalam akun
                                        Anda.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                    <span>
                                        <strong>Akurasi Data:</strong> Anda
                                        wajib memberikan informasi pendaftaran
                                        yang akurat, terkini, dan lengkap.
                                    </span>
                                </li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section
                            id="streaming"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600/20 font-bold text-amber-400">
                                    3
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    Streaming dan Lisensi Konten
                                </h2>
                            </div>
                            <p>
                                ZTV Stream memberikan Anda lisensi terbatas,
                                non-eksklusif, dan tidak dapat dipindahtangankan
                                untuk mengakses konten multimedia (film, serial
                                TV, trailer) secara streaming pribadi untuk
                                tujuan non-komersial.
                            </p>
                            <div className="space-y-1 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200 sm:text-sm">
                                <p className="flex items-center gap-1.5 font-bold">
                                    <AlertCircle className="h-4 w-4 text-amber-400" />{' '}
                                    Catatan Kualitas Video:
                                </p>
                                <p className="text-slate-300">
                                    Kualitas penayangan konten (4K UHD, Full HD,
                                    SD) bergantung pada perangkat yang Anda
                                    gunakan, serta kecepatan koneksi internet
                                    yang tersedia saat pemutaran.
                                </p>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section
                            id="pembayaran"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-600/20 font-bold text-cyan-400">
                                    4
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    Langganan, Pembayaran & Pembatalan
                                </h2>
                            </div>
                            <p>
                                Beberapa fitur ZTV Stream memerlukan pembayaran
                                paket langganan. Biaya langganan dibayarkan di
                                muka dan diperpanjang secara otomatis sesuai
                                dengan periode paket yang Anda pilih.
                            </p>
                            <p>
                                Anda dapat membatalkan paket langganan kapan
                                saja melalui menu Pengaturan Akun. Pembatalan
                                akan berlaku pada akhir periode penagihan
                                berjalan tanpa pengembalian dana parsial.
                            </p>
                        </section>

                        {/* Section 5 */}
                        <section
                            id="larangan"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 font-bold text-purple-400">
                                    5
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    Batasan Penggunaan & Larangan
                                </h2>
                            </div>
                            <p>Pengguna secara tegas dilarang untuk:</p>
                            <ul className="list-inside list-disc space-y-2 pl-2 text-slate-300">
                                <li>
                                    Merekam, mengunduh, menggandakan, atau
                                    mendistribusikan ulang materi video tanpa
                                    izin tertulis dari ZTV Stream.
                                </li>
                                <li>
                                    Menggunakan VPN, proxy, atau teknologi lain
                                    untuk mengeluh pembatasan lokasi geografis
                                    lisensi konten.
                                </li>
                                <li>
                                    Melakukan peretasan, reverse engineering,
                                    atau mencoba merusak infrastruktur keamanan
                                    sistem.
                                </li>
                            </ul>
                        </section>

                        {/* Section 6 */}
                        <section
                            id="hakcipta"
                            className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/50 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 font-bold text-emerald-400">
                                    6
                                </div>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    Hak Kekayaan Intelektual
                                </h2>
                            </div>
                            <p>
                                Seluruh hak cipta, merek dagang, desain, dan hak
                                kekayaan intelektual atas logo ZTV Stream,
                                antarmuka pengguna, dan katalog sinema merupakan
                                milik sah ZTV Stream atau pemegang lisensi
                                terkait.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <StreamingFooter />
        </div>
    );
}
