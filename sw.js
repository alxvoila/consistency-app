// v3 — black & white redesign
const C='consistency-v6-en',FONTS='consistency-fonts-v1',F=['./','index.html','style.css?v=6','app.js?v=6','data/days.js','data/chapters.js','manifest.json','icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-192.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png','favicon.ico'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==FONTS).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
 if(u.hostname.endsWith('fonts.googleapis.com')||u.hostname.endsWith('fonts.gstatic.com')){
  // fonts: cache-first, fall back silently (CSS uses Georgia/system fonts offline)
  e.respondWith(caches.open(FONTS).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{c.put(e.request,n.clone());return n}).catch(()=>new Response('',{status:200,headers:{'Content-Type':u.hostname.includes('googleapis')?'text/css':'font/woff2'}})))));return}
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('index.html')));return}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
