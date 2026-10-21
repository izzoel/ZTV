import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    CheckCircle2,
    Cloud,
    Database,
    ExternalLink,
    Film,
    Play,
    Server,
    ShieldCheck,
    Sparkles,
    Subtitles,
    Trophy,
    Tv,
} from 'lucide-react';
import { Top10MovieTable } from '@/components/streaming/Top10MovieTable';
import { FluxTable } from '@/components/ui/flux-table';
import { home } from '@/routes';

const STREAMING_SERVERS = [
    {
        name: 'Zetware Cloud MP4',
        type: 'Direct Cloud Storage',
        speed: '~15ms',
        status: 'Optimal',
        statusColor: 'green',
        isPrimary: true,
    },
    {
        name: 'Vidsrc.to',
        type: 'Multi-Embed CDN',
        speed: '~120ms',
        status: 'Online',
        statusColor: 'green',
        isPrimary: false,
    },
    {
        name: 'Videasy.net',
        type: 'Fast Player Embed',
        speed: '~145ms',
        status: 'Online',
        statusColor: 'green',
        isPrimary: false,
    },
    {
        name: 'Vidking',
        type: 'Alternative CDN',
        speed: '~180ms',
        status: 'Online',
        statusColor: 'green',
        isPrimary: false,
    },
    {
        name: '2embed.cc',
        type: 'Backup Embed Server',
        speed: '~210ms',
        status: 'Standby',
        statusColor: 'zinc',
        isPrimary: false,
    },
    {
        name: 'Autoembed.co',
        type: 'Automated Provider',
        speed: '~240ms',
        status: 'Standby',
        statusColor: 'zinc',
        isPrimary: false,
    },
];

export default function Dashboard() {
    const page = usePage();
    const authUser = (
        page.props as { auth?: { user?: { name?: string; email?: string } } }
    )?.auth?.user;

    return (
        <>
            <Head title="Dashboard - ZTV Stream Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
                {/* 1. Header Section */}
                <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
                                Dashboard Admin
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                Sistem Optimal
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Selamat datang kembali,{' '}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {authUser?.name || 'Admin'}
                            </span>
                            . Pusat kendali streaming, manajemen database media
                            beranda, dan cloud storage.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                        >
                            <Tv className="size-4" />
                            <span>Buka Platform Streaming</span>
                            <ExternalLink className="size-3.5 opacity-60" />
                        </Link>
                    </div>
                </div>

                {/* 2. Key Metrics Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Katalog TMDB Live
                            </span>
                            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <Film className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                2,500+
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                <span>Trending & Live Sync Aktif</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Cloud Media Storage
                            </span>
                            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                                <Cloud className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                Direct MP4
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                                <Sparkles className="size-3.5" />
                                <span>Multi-Resolusi (4K/1080p)</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Subtitle & Sanitizer
                            </span>
                            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                                <Subtitles className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                ID / EN Ready
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="size-3.5" />
                                <span>Sanitasi Tag ASS/SSA Aktif</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-medium">
                                Server Provider
                            </span>
                            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <Server className="size-4" />
                            </div>
                        </div>
                        <div className="mt-2.5">
                            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                                6 Provider
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <Activity className="size-3.5" />
                                <span>Multi-Embed Failover Siap</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Quick Navigation Hub Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link
                        href="/dashboard/cloud-media"
                        className="group flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-purple-500/40 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-purple-500/40"
                    >
                        <div className="shrink-0 rounded-lg bg-purple-500/10 p-3 text-purple-600 transition-transform group-hover:scale-105 dark:text-purple-400">
                            <Cloud className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-zinc-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                                    Zetware Media Cloud &rarr;
                                </h3>
                                <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                                    Menu Baru
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                Buka inspektur resolusi cloud, pemindaian
                                storage lokal hostinger, dan koleksi film direct
                                MP4 beresolusi 4K & FHD.
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/database-media"
                        className="group flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-500/40 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-indigo-500/40"
                    >
                        <div className="shrink-0 rounded-lg bg-indigo-500/10 p-3 text-indigo-600 transition-transform group-hover:scale-105 dark:text-indigo-400">
                            <Database className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                                    Database Media &rarr;
                                </h3>
                                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                    Menu Baru
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                Lihat dan kelola seluruh daftar film dan serial
                                TV yang tayang pada beranda utama ZTV Stream
                                beserta ranking Top 10.
                            </p>
                        </div>
                    </Link>
                </div>

                {/* 4. Top 10 Movies Component Section */}
                <Top10MovieTable
                    title="Peringkat Top 10 Film & Konten Beranda Hari Ini"
                    description="10 konten streaming paling populer di Indonesia yang aktif tayang di beranda utama."
                    showBleed={true}
                />

                {/* 5. Server Provider Status Table */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex items-center justify-between pb-4">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
                                <Server className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Status Provider Video Streaming</span>
                            </h2>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                Status kesehatan jaringan dan urutan prioritas
                                failover engine pemutar video.
                            </p>
                        </div>
                        <span className="size-2 animate-ping rounded-full bg-emerald-500" />
                    </div>

                    <FluxTable bleed containerClassName="mt-4">
                        <FluxTable.Columns sticky>
                            <FluxTable.Column>Nama Server</FluxTable.Column>
                            <FluxTable.Column>Tipe Layanan</FluxTable.Column>
                            <FluxTable.Column>Prioritas</FluxTable.Column>
                            <FluxTable.Column>Latensi Respon</FluxTable.Column>
                            <FluxTable.Column align="end">
                                Status
                            </FluxTable.Column>
                        </FluxTable.Columns>

                        <FluxTable.Rows>
                            {STREAMING_SERVERS.map((server, idx) => (
                                <FluxTable.Row key={idx}>
                                    <FluxTable.Cell variant="strong">
                                        <span className="font-medium text-zinc-900 dark:text-white">
                                            {server.name}
                                        </span>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {server.type}
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        {server.isPrimary ? (
                                            <span className="inline-flex items-center rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                                Server Utama (MP4)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                                Failover CDN
                                            </span>
                                        )}
                                    </FluxTable.Cell>

                                    <FluxTable.Cell>
                                        <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                                            {server.speed}
                                        </span>
                                    </FluxTable.Cell>

                                    <FluxTable.Cell align="end">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                server.statusColor === 'green'
                                                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                    : 'border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}
                                        >
                                            <span
                                                className={`size-1.5 rounded-full ${
                                                    server.statusColor ===
                                                    'green'
                                                        ? 'bg-emerald-500'
                                                        : 'bg-zinc-400'
                                                }`}
                                            />
                                            {server.status}
                                        </span>
                                    </FluxTable.Cell>
                                </FluxTable.Row>
                            ))}
                        </FluxTable.Rows>
                    </FluxTable>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
