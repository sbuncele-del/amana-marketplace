/* Cache only the public offline screen and app icons. Never cache catalogue,
   account, cart, API, prices, stock, HTML pages or payment responses. */
const CACHE = 'plentovo-offline-v1';
const OFFLINE = '/offline.html';
const STATIC = [OFFLINE, '/brand/plentovo-icon.png', '/icons/plentovo-512.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('plentovo-offline-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 if(event.request.method !== 'GET') return;
 const url = new URL(event.request.url);
 if(url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
 if(STATIC.includes(url.pathname) && !url.search){
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
  return;
 }
 if(event.request.mode !== 'navigate') return;
 event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE).then(response => response || Response.error())));
});
