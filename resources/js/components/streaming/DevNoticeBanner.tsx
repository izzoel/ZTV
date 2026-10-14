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
        <div className="fixed bottom-4 left-4 z-40 w-auto max-w-[280px] sm:max-w-xs bg-slate-950/90 backdrop-blur-md border border-amber-500/30 rounded-xl shadow-xl p-2 sm:p-2.5 text-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-300 select-none">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
                    <Wrench className="w-3.5 h-3.5 animate-pulse" />
                </div>

                <div className="flex-1 min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-amber-400 text-[11px]">Versi Beta</span>
                        <span className="text-[10px] text-slate-400">• Dalam pengembangan</span>
                    </div>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="p-0.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                    title="Tutup pemberitahuan"
                    aria-label="Tutup pemberitahuan"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Subtle auto-dismiss progress line */}
            <div className="mt-1.5 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full animate-progress" />
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
