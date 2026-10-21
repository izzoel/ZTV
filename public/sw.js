/**
 * ZTV Application Anti-Ad & Tracker Service Worker (Cara 3)
 * Intercepts background ad/tracker network requests without using browser extensions
 */

const AD_TRACKER_DOMAINS = [
    'histats.com',
    'acscdn.com',
    'usrpubtrk.com',
    'adexchangeclear.com',
    'preferencenail.com',
    'protrafficinspector.com',
    'kettledroopingcontinuation.com',
    'lt.talosempest.com',
    'adeptspiritual.com',
    'popads.net',
    'popcash.net',
    'propellerads.com',
    'exoclick.com',
    'juicyads.com',
    'adsterra.com',
    'bet365',
    'slot',
    'gacor',
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();

    // Check if the requested URL belongs to a known ad or tracker domain
    const isAdRequest = AD_TRACKER_DOMAINS.some((domain) =>
        url.includes(domain),
    );

    if (isAdRequest) {
        console.warn('[ZTV Anti-Ad SW] Blocked request:', event.request.url);
        // Respond with 204 No Content to instantly cancel the ad request
        event.respondWith(
            new Response(null, {
                status: 204,
                statusText: 'No Content (Blocked by ZTV Anti-Ad Engine)',
            }),
        );
    }
});
