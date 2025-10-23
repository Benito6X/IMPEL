
const CACHE='impel-ultimate-v1';
const ASSETS=['./','./index.html','./catalogo.html','./contacto.html','./style.css','./script.js','./assets/logo.png','./assets/storefront.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
