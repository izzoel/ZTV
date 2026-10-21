import { useState, useEffect } from 'react';
import { Wrench, X } from 'lucide-react';

export default function DevNoticeBanner() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Auto-dismiss banner after 7 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 7000);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 z-40 w-auto max-w-[280px] animate-in rounded-xl border border-amber-500/30 bg-slate-950/90 p-2 text-slate-200 shadow-xl backdrop-blur-md duration-300 select-none fade-in slide-in-from-bottom-3 sm:max-w-xs sm:p-2.5">
            <div className="flex items-center gap-2">
                <div className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/20 p-1.5 text-amber-400">
                    <Wrench className="h-3.5 w-3.5 animate-pulse" />
                </div>

                <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-amber-400">
                            Versi Beta
                        </span>
                        <span className="text-[10px] text-slate-400">
                            • Dalam pengembangan
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="shrink-0 cursor-pointer rounded-md p-0.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    title="Tutup pemberitahuan"
                    aria-label="Tutup pemberitahuan"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Subtle auto-dismiss progress line */}
            <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="animate-progress h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500" />
            </div>

            <style>{`
                @keyframes progressAnim {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-progress {
                    animation: progressAnim 7s linear forwards;
                }
            `}</style>
        </div>
    );
}
