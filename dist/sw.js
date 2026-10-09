/* SPeeD GAME — service worker minimo.
   Serve solo perché il telefono riconosca il sito come app installabile
   (icona sulla Home, si apre senza la barra dell'indirizzo).
   Non salva niente: ogni volta prende la versione aggiornata dalla rete.
   La pagina la chiede sempre "fresca" (senza la copia che il browser tiene per 10 minuti):
   così, appena pubblichiamo, chi riapre l'app vede subito la versione nuova. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  // tocca solo le pagine del sito; profili, online e tutto il resto passano diretti
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }).catch(function () { return fetch(e.request); }));
    return;
  }
  e.respondWith(fetch(e.request));
});
