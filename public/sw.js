// EquityClimb v4 service worker: network-first app updates, cached offline fallback.
const C='eq-v4';
const F=['./','./index.html','./styles.css','./premium.css','./app.js','./upgrade.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./icon-180.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.pathname.includes('/api/')||u.origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});
