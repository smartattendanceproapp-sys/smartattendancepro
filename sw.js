/* Service worker: network first (so updates show up), saved copy when offline. Also keeps the Firebase/QR libraries so the app can open without internet. */
const CACHE = 'sap-v2';
const FILES = ['./', 'index.html', 'firebase-config.js', 'manifest.json', 'privacy.html', 'icon-192.png', 'icon-512.png'];
const HOSTS = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin && HOSTS.indexOf(u.hostname) < 0) return;
  e.respondWith(fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});
