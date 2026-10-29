/* Offline screen only. Never cache products, prices, stock, carts, accounts or API responses. */
const PREFIX='plentovo-algeria-offline-',CACHE=PREFIX+'v1',BASE='/algeria/',OFFLINE=BASE+'offline.html';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.add(OFFLINE))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||event.request.mode!=='navigate')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;event.respondWith(fetch(event.request).catch(()=>caches.match(OFFLINE).then(response=>response||Response.error())));});
