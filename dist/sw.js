/* SPeeD GAME — service worker.
   Serve perché il telefono riconosca il sito come app installabile
   (icona sulla Home, si apre senza la barra dell'indirizzo).
   La pagina la chiede sempre "fresca" (senza la copia che il browser tiene per 10 minuti):
   così, appena pubblichiamo, chi riapre l'app vede subito la versione nuova.
   📦 (4 nov 2026, #31 parte 2) I file con l'impronta nel nome (cuore.<impronta>.js, stile.<impronta>.css,
   novita.<impronta>.js, giochi/<pezzo>.<impronta>.js) non cambiano mai: si tengono sul telefono
   (prima la copia, poi la rete) e una versione nuova butta via quella vecchia dello stesso file.
   Così ogni gioco si scarica una volta sola, e a una pubblicazione solo quello che è cambiato. */
var CASSA = "sg-file-v1";
// "giochi/asta.0123456789.js" → { nome: "giochi/asta", imp: "0123456789" } (null = un file senza impronta)
function conImpronta(url) {
  var m = /\/((?:giochi\/)?[a-z0-9-]+)\.([0-9a-f]{10})\.(js|css)$/.exec(url.pathname);
  return m ? { nome: m[1] + "." + m[3], imp: m[2] } : null;
}
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(function (l) { return Promise.all(l.filter(function (k) { return /^sg-file-/.test(k) && k !== CASSA; }).map(function (k) { return caches.delete(k); })); })
  ]));
});
self.addEventListener("fetch", function (e) {
  // tocca solo le pagine del sito; profili, online e tutto il resto passano diretti
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }).catch(function () { return fetch(e.request); }));
    return;
  }
  var url = new URL(e.request.url), F = conImpronta(url);
  if (!F || !self.caches) { e.respondWith(fetch(e.request)); return; }
  e.respondWith(caches.open(CASSA).then(function (C) {
    return C.match(url.pathname).then(function (c) {
      if (c) return c;
      return fetch(e.request).then(function (r) {
        if (r && r.ok && r.status === 200) {
          var copia = r.clone();
          // (via le versioni vecchie dello stesso file, poi la nuova)
          C.keys().then(function (l) {
            l.forEach(function (q) { var V = conImpronta(new URL(q.url)); if (V && V.nome === F.nome && V.imp !== F.imp) C.delete(q); });
            return C.put(url.pathname, copia);
          }).catch(function () {});
        }
        return r;
      });
    });
  }).catch(function () { return fetch(e.request); }));
});
