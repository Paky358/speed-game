/* 🏠📦 LA PORTA DI TRASLOCO (26 nov 2026): chi apre il vecchio indirizzo arriva su Revel House col profilo e le sue cose.
   - niente profilo e niente cose sul telefono: si va subito su Revel House (coi link vecchi: #sala=…, #gruppo=…, #gioco=…&stanza=…);
   - se no: il pacco chiuso a chiave nel deposito (js/trasloco.js) e si va su Revel House col codice nel link (dopo il #).
   Se qualcosa non va: «↻ Riprova» o «Vai su Revel House ▶» (lì si entra con nome e password). */
(function () {
  "use strict";
  var A = window.SG_PORTA_A || "https://revelhouse.it/";
  var $ = function (id) { return document.getElementById(id); };
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});   // (prende il posto di quello della vecchia app)
  function vai(codice) {
    var parti = (location.hash || "").replace(/^#/, "").split("&").filter(function (x) { return x && !/^trasloco=/.test(x); });
    if (codice) parti.push("trasloco=" + String(codice).replace(/-/g, ""));
    location.replace(A + (parti.length ? "#" + parti.join("&") : ""));
  }
  function guasto(testo) {
    $("st").textContent = testo;
    $("t").style.display = "flex";
  }
  $("vai").onclick = function () { vai(null); };
  $("riprova").onclick = function () { $("t").style.display = "none"; parti(); };
  function parti() {
    $("st").textContent = "📦 Preparo le tue cose…";
    if (!window.SGTrasloco || !window.crypto || !crypto.subtle) return guasto("Questo telefono è un po' vecchio: vai su Revel House ed entra col tuo nome e la tua password.");
    SGTrasloco.leggiAccesso().then(function (u) {
      if (!u || !u.uid) return vai(null);   // (niente profilo qui: non c'è niente da portare che serva)
      return SGTrasloco.prepara().then(function (r) {
        $("st").textContent = "✅ Fatto! Ti porto su Revel House…";
        $("cod").textContent = r.codice; $("cod").style.display = "block";
        setTimeout(function () { vai(r.codice); }, 1400);
      });
    }).catch(function (e) {
      guasto(/^deposito|rinnovo/.test(e && e.message) || !navigator.onLine ? "📶 Non riesco a preparare le tue cose: controlla la rete e riprova." : "Non riesco a preparare le tue cose: riprova, oppure vai su Revel House ed entra col tuo nome e la tua password.");
    });
  }
  parti();
})();
