import React from 'react';

export default function StreamingSkeleton() {
    return (
        <div className="w-full space-y-8 select-none">
            {/* Hero Spotlight Skeleton */}
            <div className="relative mx-auto flex h-[80vh] max-h-[750px] min-h-[540px] w-full max-w-7xl flex-col justify-end overflow-hidden border-b border-white/5 bg-slate-950/90 px-4 pt-28 pb-16 sm:px-6 lg:px-8">
                {/* Background Shimmer */}
                <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-slate-950 via-slate-900/60 to-slate-950" />

                {/* Content Skeleton */}
                <div className="relative z-10 max-w-2xl space-y-4">
                    {/* Badge Pill Placeholders */}
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-24 animate-pulse rounded-md bg-slate-800/80" />
                        <div className="h-6 w-20 animate-pulse rounded-md bg-slate-800/80" />
                        <div className="h-6 w-16 animate-pulse rounded-md bg-slate-800/80" />
                    </div>

                    {/* Title Placeholder */}
                    <div className="h-12 w-3/4 max-w-lg animate-pulse rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700/60 to-slate-800 sm:h-16" />

                    {/* Subtitle / Metadata */}
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-12 animate-pulse rounded bg-slate-800/70" />
                        <div className="h-4 w-16 animate-pulse rounded bg-slate-800/70" />
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-800/70" />
                    </div>

                    {/* Synopsis Placeholder Lines */}
                    <div className="max-w-xl space-y-2 pt-2">
                        <div className="h-4.5 w-full animate-pulse rounded-md bg-slate-800/60" />
                        <div className="h-4.5 w-5/6 animate-pulse rounded-md bg-slate-800/60" />
                        <div className="h-4.5 w-4/6 animate-pulse rounded-md bg-slate-800/60" />
                    </div>

                    {/* Buttons Skeleton */}
                    <div className="flex items-center gap-3 pt-4">
                        <div className="flex h-12 w-44 animate-pulse items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-900/40" />
                        <div className="flex h-12 w-36 animate-pulse items-center justify-center rounded-2xl border border-white/10 bg-slate-800/90" />
                    </div>
                </div>
            </div>

            {/* Genre Pill Filter Skeleton */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((idx) => (
                        <div
                            key={idx}
                            className="h-9 w-28 flex-none animate-pulse rounded-full border border-white/5 bg-slate-900"
                        />
                    ))}
                </div>
            </div>

            {/* Top 10 Row Skeleton */}
            <div className="mx-auto my-10 max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="h-7 w-2 animate-pulse rounded-full bg-red-600" />
                    <div className="h-7 w-64 animate-pulse rounded-lg bg-slate-800/80" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="flex items-end gap-2">
                            <div className="h-24 w-12 animate-pulse rounded-lg bg-slate-800/40" />
                            <div className="aspect-[2/3] w-full animate-pulse rounded-2xl border border-white/5 bg-slate-900" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Movie Row Skeletons (2 rows) */}
            {[1, 2].map((rowIdx) => (
                <div
                    key={rowIdx}
                    className="mx-auto my-8 max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8"
                >
                    <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-800/80" />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {[1, 2, 3, 4, 5, 6].map((cardIdx) => (
                            <div
                                key={cardIdx}
                                className="flex aspect-[2/3] w-full animate-pulse flex-col justify-end space-y-2 rounded-2xl border border-white/5 bg-slate-900 p-3"
                            >
                                <div className="h-4 w-3/4 rounded bg-slate-800/80" />
                                <div className="h-3 w-1/2 rounded bg-slate-800/50" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
