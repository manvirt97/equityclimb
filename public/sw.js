/* EquityClimb service worker v16.8 - preserve saved data; prefer fresh HTML and scripts. */
const C='eq-v16-9-rate-integrity',F=['./','./index.html','./release.json','./ec-pwa-update.js','./ec-pwa-update.css','./ec-mortgage-modes.js','./ec-mortgage-impact.js','./ec-mortgage-impact.css','./privacy.html','./ddf-connection-check.html','./styles.css','./premium.css','./v5-market.css','./currents-key.css','./ec-v7.css','./ec-v8.css','./ec-v10.css','./ec-v12.css','./ec-v13.css','./ec-v14.css','./ec-v15.css','./ec-v15-2.css','./ec-v15-3.css','./ec-v15-4.css','./ec-v16.css','./ec-v16-1.css','./ec-v16-2.css','./ec-v16-3.css','./ec-v16-5.css','./currents-key.js','./app.js','./phase1.js','./refresh-fix.js','./ec-learn-data.js','./ec-v7.js','./ec-v8.js','./ec-v9.js','./ec-v10.js','./ec-v12.js','./ec-money-core.js','./ec-v13.js','./ec-v14.js','./ec-v15.js','./ec-v15-2.js','./ec-v15-3.js','./ec-v15-4.js','./ec-v16.js','./ec-v16-1.js','./ec-v16-2.js','./ec-v16-3.js','./ec-v16-5.js','./ec-auth.js','./manifest.webmanifest','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(C);
    // Do NOT activate a half-installed update if the core app shell is unavailable.
    await cache.add(new Request('./index.html',{cache:'no-store'}));
    await Promise.allSettled(F.filter(path=>path!=='./index.html').map(path=>
      cache.add(new Request(path,{cache:'no-store'}))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  // Never clear financial data or caches owned by other applications.
  await Promise.all(keys.filter(name=>name.startsWith('eq-')&&name!==C).map(name=>caches.delete(name)));
  await self.clients.claim();
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of clients)client.postMessage({type:'EQUITYCLIMB_UPDATED',version:'16.8.0'});
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||
      url.pathname.includes('/api/')||url.pathname.includes('/__/'))return;
  const shell=event.request.mode==='navigate'||/\.(?:html|js|css|webmanifest)$/.test(url.pathname)||url.pathname.endsWith('/')||
              url.pathname.endsWith('/release.json');
  event.respondWith((async()=>{
    try{
      const res=await fetch(shell?new Request(event.request,{cache:'no-store'}):event.request);
      if(res.ok){
        const copy=res.clone();
        event.waitUntil(caches.open(C).then(cache=>cache.put(event.request,copy)).catch(()=>{}));
      }
      return res;
    }catch(_){
      const match=await caches.match(event.request) ||
          (event.request.mode==='navigate'?await caches.match('./index.html'):null) ||
          await caches.match(event.request,{ignoreSearch:true});
      if(match)return match;
      return new Response('Offline: connect to the internet for current rates and app updates.',{
        status:503,headers:{'content-type':'text/plain;charset=utf-8'}
      });
    }
  })());
});
