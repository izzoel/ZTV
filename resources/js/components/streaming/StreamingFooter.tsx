import {
    Tv,
    Smartphone,
    Monitor,
    Gamepad2,
    Globe,
    ChevronDown,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useLanguage, Language } from '@/lib/i18n';

export default function StreamingFooter() {
    const { language, setLanguage, t } = useLanguage();

    return (
        <footer className="mt-16 border-t border-white/10 bg-slate-950 px-4 py-10 text-xs text-slate-400 sm:mt-20 sm:px-6 sm:py-12 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Available Devices Section */}
                <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 p-4 sm:p-6 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-600/20 text-sm font-black text-red-500">
                            ZTV
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white sm:text-base">
                                {t('footer_devices_title')}
                            </h4>
                            <p className="text-xs leading-relaxed text-slate-400">
                                {t('footer_devices_desc')}
                            </p>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-2 items-center gap-2.5 text-slate-300 sm:flex sm:flex-wrap sm:gap-3 lg:w-auto">
                        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium sm:w-auto sm:justify-start sm:py-1.5">
                            <Tv className="h-4 w-4 shrink-0 text-red-400" />
                            <span>Smart TV</span>
                        </div>
                        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium sm:w-auto sm:justify-start sm:py-1.5">
                            <Smartphone className="h-4 w-4 shrink-0 text-cyan-400" />
                            <span>Mobile App</span>
                        </div>
                        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium sm:w-auto sm:justify-start sm:py-1.5">
                            <Monitor className="h-4 w-4 shrink-0 text-emerald-400" />
                            <span>Web Browser</span>
                        </div>
                        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium sm:w-auto sm:justify-start sm:py-1.5">
                            <Gamepad2 className="h-4 w-4 shrink-0 text-amber-400" />
                            <span>Console</span>
                        </div>
                    </div>
                </div>

                {/* Footer Links Grid */}
                <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2 sm:gap-8">
                    <div className="space-y-2.5">
                        <h5 className="text-[11px] font-bold tracking-wider text-white uppercase">
                            {t('footer_terms_title')}
                        </h5>
                        <ul className="space-y-2 text-slate-400">
                            <li>
                                <Link
                                    href="/terms"
                                    className="transition hover:text-white"
                                >
                                    {t('footer_terms_link')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="transition hover:text-white"
                                >
                                    {t('footer_privacy_link')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/cookies"
                                    className="transition hover:text-white"
                                >
                                    {t('footer_cookie_link')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-2.5">
                        <h5 className="text-[11px] font-bold tracking-wider text-white uppercase">
                            {t('footer_lang_title')}
                        </h5>
                        <div className="relative w-full sm:w-64">
                            <select
                                value={language}
                                onChange={(e) =>
                                    setLanguage(e.target.value as Language)
                                }
                                className="w-full cursor-pointer appearance-none rounded-xl border border-white/20 bg-slate-900/90 py-2.5 pr-8 pl-9 text-xs font-medium text-white shadow-lg transition-all hover:border-red-500/50 focus:ring-2 focus:ring-red-500/40 focus:outline-none"
                            >
                                <option
                                    value="id"
                                    className="bg-slate-900 py-1 text-white"
                                >
                                    🇮🇩 Bahasa Indonesia
                                </option>
                                <option
                                    value="en"
                                    className="bg-slate-900 py-1 text-white"
                                >
                                    🇺🇸 English (US)
                                </option>
                            </select>
                            <Globe className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-red-400" />
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </div>
                        <p className="pt-2 text-[11px] leading-relaxed text-slate-500">
                            {t('footer_copyright')}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
