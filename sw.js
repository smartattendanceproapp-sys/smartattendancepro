/* Service worker: network first (so updates show up), saved copy when offline. Also keeps the Firebase/QR libraries so the app can open without internet. */
const CACHE = 'sap-v9';
const FILES = ['./', 'index.html', 'firebase-config.js', 'manifest.json', 'privacy.html', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'splash.jpg'];
const HOSTS = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  const ext = u.origin !== location.origin;
  if (ext && HOSTS.indexOf(u.hostname) < 0) return;
  const save = r => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; };
  if (ext || /\.(png|jpg|json)$/.test(u.pathname)) {
    /* libraries, fonts, pictures: open instantly from the saved copy, refresh it quietly */
    e.respondWith(caches.match(e.request).then(m => { const n = fetch(e.request).then(save).catch(() => m); return m || n; }));
  } else {
    /* the app itself: newest copy when the network answers quickly, otherwise the saved copy */
    e.respondWith(new Promise(res => {
      let done = false; const t = setTimeout(() => caches.match(e.request).then(m => { if (m && !done) { done = true; res(m); } }), 2500);
      fetch(e.request).then(r => { clearTimeout(t); if (!done) { done = true; res(save(r)); } else save(r); })
        .catch(() => { clearTimeout(t); caches.match(e.request).then(m => { if (!done) { done = true; res(m || Response.error()); } }); });
    }));
  }
});
