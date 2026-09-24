/* SPeeD GAME — service worker minimo.
   Serve solo perché il telefono riconosca il sito come app installabile
   (icona sulla Home, si apre senza la barra dell'indirizzo).
   Non salva niente: ogni volta prende la versione aggiornata dalla rete. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  // tocca solo le pagine del sito; profili, online e tutto il resto passano diretti
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request));
});
