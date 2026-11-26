/* 🏠📦 Il service worker della PORTA DI TRASLOCO (26 nov 2026): prende il posto di quello della vecchia app SPeeD GAME,
   butta via i file che teneva sul telefono e non tiene niente (la porta chiede sempre la pagina alla rete). */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (l) { return Promise.all(l.map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
