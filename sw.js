const CACHE = 'trfbt-v1';
const FILES = ['./', 'index.html', 'manifest.json', 'css/style.css', 'js/app.js', 'js/receipt.js',
  'js/storage.js', 'js/printer.js', 'assets/favicon.svg', 'assets/icon-192.png', 'assets/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
