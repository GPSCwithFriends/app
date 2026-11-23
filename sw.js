/* GPSC with Friends – service worker.
   Opens the app instantly from the phone's copy and updates that copy in the background.
   Data always comes fresh from Apps Script (never cached here).
   When you upload a new index.html, change VERSION below so every phone picks it up. */
const VERSION = 'gwf-2026-11-23-rem1';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'img/logo_full.jpg', 'img/logo_mark.png', 'img/vidhansabha.jpg', 'img/sachivalaya_campus.jpg',
  'img/collector_car.jpg', 'img/collector_office.jpg', 'img/police_jeep.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                                          // API calls (POST) go straight to Google
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return;
  if (/drive\.google\.com$/.test(url.hostname)) return;                      // PDFs are never cached
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  // stale-while-revalidate: answer from the cache at once, refresh the copy for next time
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: url.origin === location.origin });
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
