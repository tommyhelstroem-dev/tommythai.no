/* Tommythai service worker – gjør siden installerbar og delvis tilgjengelig uten nett */
const V = "tommythai-v4";
const PRE = ["/", "/index.html", "/hjem.html", "/meny.html", "/oppskrifter.html", "/bilder.html", "/events.html", "/artikler.html",
  "/personvern.html", "/takk.html", "/app.html", "/forespoersel.html", "/style.css", "/app.js", "/logo.jpg", "/logo_mark.svg",
  "/favicon.svg", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.allSettled(PRE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // Firebase, CDN, Web3Forms: rør ikke
  const isDoc = req.mode === "navigate" || /\.(html|css|js|webmanifest)$/.test(url.pathname) || url.pathname.endsWith("/");
  if (isDoc) {
    // Nettverk først – alltid nyeste versjon når du er på nett, cache når du er uten nett
    e.respondWith(fetch(req, { cache: "no-cache" }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("/hjem.html") : undefined))));
  } else {
    // Bilder og annet: cache først, hent i bakgrunnen
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
