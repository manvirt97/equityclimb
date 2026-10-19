/* EquityClimb service worker v6.1 - network first, so new uploads show up straight away. */
const C='eq-v61',F=['./','./index.html','./styles.css','./premium.css','./v5-market.css','./currents-key.css','./currents-key.js','./app.js','./phase1.js','./v5-market.js','./manifest.webmanifest','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.allSettled(F.map(f=>c.add(f)))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.pathname.includes('/api/')||u.origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
