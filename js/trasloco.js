/* =========================================================
   🏠📦 IL TRASLOCO (26 nov 2026, Revel House): l'accesso e le cose del telefono da un indirizzo all'altro, senza password.
   Il problema: il profilo (Firebase) e tutto quello che il telefono ricorda (gettone, Compagnie, carte già uscite, regole…)
   stanno legati all'INDIRIZZO del sito. Spostando l'app da paky358.github.io/speed-game a revelhouse.it, il telefono
   si ritroverebbe vuoto e chi ha dimenticato la password perderebbe il profilo.
   Come funziona:
   - PARTE (sul vecchio indirizzo, la «porta di trasloco», o dal profilo: «📲 Porta il profilo su un altro telefono»):
     si fa un PACCO con l'accesso a Firebase (lo stesso che il telefono tiene già) e con tutto il localStorage;
     si chiude a chiave (AES-GCM, la chiave nasce da un CODICE di 8 lettere a caso) e si lascia in Firestore
     (traslochi/<impronta del codice>) per 2 ore. Nel deposito c'è solo roba chiusa a chiave: il codice non ci va mai.
   - ARRIVA (sul nuovo indirizzo): col codice nel link (dopo il #: non lo riceve nessun server, e qui si toglie subito
     dall'indirizzo) o scritto a mano («📦 Ho un codice di trasloco»): si prende il pacco, si apre, si rimette l'accesso
     dove Firebase lo cerca e le cose del telefono al loro posto, e la pagina si riapre: si è dentro, senza password.
   Firestore si usa con le chiamate semplici (REST): niente bisogno di Firebase già acceso, e le prove le possono fingere.
   Le regole del deposito (da incollare in Firestore) stanno in docs/revel-house-trasloco.md.
   ========================================================= */
(function () {
  "use strict";
  var KEY = "AIzaSyCxCbBMyn8Y_Xjfl2raDwGw-YmfgVeZj4g", PROGETTO = "speed-game-33c5b";
  var DOCS = "https://firestore.googleapis.com/v1/projects/" + PROGETTO + "/databases/(default)/documents/traslochi";
  var FB_UTENTE = "firebase:authUser:" + KEY + ":[DEFAULT]";   // dove Firebase tiene l'accesso (IndexedDB, o localStorage sui telefoni senza)
  var DURATA = 2 * 60 * 60 * 1000;   // il pacco resta 2 ore (su iPhone: si reinstalla l'app e si scrive il codice)
  var MAX_B64 = 950000;              // un documento di Firestore sta sotto 1 MB
  var LETTERE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // come i codici delle stanze: niente O, I, 0, 1
  var ARRIVO_K = "sg-trasloco-arrivo", ULTIMO_K = "sg-trasloco-ultimo";
  // le cose che restano sul telefono di partenza quando si porta il profilo su UN ALTRO telefono (che resta in uso)
  var SOLO_QUI = /^(sg-dev|sg-ripresa|sg-mia-sala|sg-broker|sg-trasloco-)/;

  // ---------- piccoli aiuti ----------
  var te = new TextEncoder(), td = new TextDecoder();
  function b64(u8) { var s = "", i, C = 0x8000; for (i = 0; i < u8.length; i += C) s += String.fromCharCode.apply(null, u8.subarray(i, i + C)); return btoa(s); }
  function daB64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return (x < 16 ? "0" : "") + x.toString(16); }).join(""); }
  function normCodice(c) { return String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function codiceValido(c) { c = normCodice(c); if (c.length !== 8) return false; for (var i = 0; i < 8; i++) if (LETTERE.indexOf(c[i]) < 0) return false; return true; }
  function bello(c) { c = normCodice(c); return c.slice(0, 4) + "-" + c.slice(4); }
  function nuovoCodice() { var r = crypto.getRandomValues(new Uint8Array(8)), s = ""; for (var i = 0; i < 8; i++) s += LETTERE[r[i] % 32]; return s; }
  function idDi(c) { return crypto.subtle.digest("SHA-256", te.encode("revelhouse-trasloco:" + normCodice(c))).then(function (h) { return hex(h).slice(0, 40); }); }
  function chiave(c, sale) {
    return crypto.subtle.importKey("raw", te.encode(normCodice(c)), "PBKDF2", false, ["deriveKey"]).then(function (k) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: sale, iterations: 150000, hash: "SHA-256" }, k, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }
  // gzip quando il telefono lo sa fare (Chrome 80+, Safari 16.4+): le memorie delle carte uscite si stringono tanto
  function comprimi(u8) {
    if (!window.CompressionStream) return Promise.resolve({ z: 0, d: u8 });
    var s = new Blob([u8]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Response(s).arrayBuffer().then(function (b) { return { z: 1, d: new Uint8Array(b) }; });
  }
  function scomprimi(u8, z) {
    if (!z) return Promise.resolve(u8);
    var s = new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(s).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }

  // ---------- l'accesso a Firebase, letto e scritto dove lo tiene Firebase (senza accendere Firebase) ----------
  function apriDB() {
    return new Promise(function (ok, no) {
      var q; try { q = indexedDB.open("firebaseLocalStorageDb", 1); } catch (e) { return no(e); }
      q.onupgradeneeded = function () { var db = q.result; if (!db.objectStoreNames.contains("firebaseLocalStorage")) db.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" }); };
      q.onsuccess = function () { ok(q.result); };
      q.onerror = function () { no(q.error); };
    });
  }
  function leggiAccesso() {
    var daLS = null; try { daLS = JSON.parse(localStorage.getItem(FB_UTENTE) || "null"); } catch (e) {}
    return apriDB().then(function (db) {
      return new Promise(function (ok) {
        try {
          var q = db.transaction("firebaseLocalStorage", "readonly").objectStore("firebaseLocalStorage").get(FB_UTENTE);
          q.onsuccess = function () { db.close(); ok((q.result && q.result.value) || daLS); };
          q.onerror = function () { db.close(); ok(daLS); };
        } catch (e) { db.close(); ok(daLS); }
      });
    }).catch(function () { return daLS; });
  }
  function scriviAccesso(u) {
    return apriDB().then(function (db) {
      return new Promise(function (ok, no) {
        var tx = db.transaction("firebaseLocalStorage", "readwrite");
        tx.objectStore("firebaseLocalStorage").put({ fbase_key: FB_UTENTE, value: u });
        tx.oncomplete = function () { db.close(); ok(); };
        tx.onerror = function () { db.close(); no(tx.error); };
      });
    }).catch(function () { try { localStorage.setItem(FB_UTENTE, JSON.stringify(u)); } catch (e) {} });   // (telefono senza IndexedDB: Firebase lo cerca anche qui)
  }
  // un lasciapassare fresco per scrivere nel deposito (quello del telefono, o uno nuovo dal rinnovo di Firebase)
  function lasciapassare(u) {
    var st = u && u.stsTokenManager;
    if (!st || !st.refreshToken) return Promise.reject(new Error("senza accesso"));
    if (st.accessToken && st.expirationTime > Date.now() + 120000) return Promise.resolve(st.accessToken);
    return fetch("https://securetoken.googleapis.com/v1/token?key=" + KEY, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(st.refreshToken)
    }).then(function (r) { if (!r.ok) throw new Error("rinnovo " + r.status); return r.json(); }).then(function (j) {
      st.accessToken = j.id_token || j.access_token; st.refreshToken = j.refresh_token || st.refreshToken;
      st.expirationTime = Date.now() + (+j.expires_in || 3600) * 1000;
      return st.accessToken;
    });
  }

  // ---------- il pacco ----------
  function cose(altroTelefono) {
    var o = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k === FB_UTENTE || /^firebase:/.test(k) || /^sg-trasloco-/.test(k)) continue;
        if (altroTelefono && SOLO_QUI.test(k)) continue;
        o[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return o;
  }
  function chiudi(codice, pacco) {
    var sale = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return comprimi(te.encode(JSON.stringify(pacco))).then(function (c) {
      return chiave(codice, sale).then(function (k) { return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, c.d); })
        .then(function (cif) { return { dati: b64(new Uint8Array(cif)), sale: b64(sale), iv: b64(iv), z: c.z }; });
    });
  }
  // prepara(opz) → { codice, scade } : il pacco è nel deposito. opz.altroTelefono = il telefono di partenza resta in uso
  function prepara(opz) {
    opz = opz || {};
    return leggiAccesso().then(function (u) {
      var ls = cose(!!opz.altroTelefono);
      if (!u || !u.uid) return Promise.reject(new Error("senza accesso"));
      return lasciapassare(u).then(function (tok) {
        var scade = Date.now() + DURATA;
        var pacco = { v: 1, ora: Date.now(), da: location.host, uid: u.uid, accesso: u, ls: ls };
        function prova(volte) {
          var codice = nuovoCodice();
          return chiudi(codice, pacco).then(function (z) {
            // troppo grande? via le cose più grosse (le memorie delle carte uscite), mai il profilo
            if (z.dati.length > MAX_B64) {
              var chiavi = Object.keys(pacco.ls).sort(function (a, b) { return pacco.ls[b].length - pacco.ls[a].length; });
              if (!chiavi.length) return Promise.reject(new Error("pacco troppo grande"));
              delete pacco.ls[chiavi[0]];
              return prova(volte);
            }
            return idDi(codice).then(function (id) {
              var corpo = { fields: {
                dati: { bytesValue: z.dati }, sale: { bytesValue: z.sale }, iv: { bytesValue: z.iv },
                z: { integerValue: String(z.z) }, v: { integerValue: "1" },
                scade: { timestampValue: new Date(scade).toISOString() }, da: { stringValue: u.uid }
              } };
              return fetch(DOCS + "?documentId=" + id, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify(corpo) })
                .then(function (r) {
                  if (r.status === 409 && volte < 3) return prova(volte + 1);   // (codice già usato: un altro)
                  if (!r.ok) throw new Error("deposito " + r.status);
                  butta(tok);   // il pacco di prima di questo telefono non serve più
                  try { localStorage.setItem(ULTIMO_K, JSON.stringify({ id: id, scade: scade })); } catch (e) {}
                  return { codice: bello(codice), scade: scade };
                });
            });
          });
        }
        return prova(0);
      });
    });
  }
  function butta(tok) {
    var u = null; try { u = JSON.parse(localStorage.getItem(ULTIMO_K) || "null"); } catch (e) {}
    if (!u || !u.id || u.scade < Date.now()) return;
    fetch(DOCS + "/" + u.id, { method: "DELETE", headers: { Authorization: "Bearer " + tok } }).catch(function () {});
  }

  // ricevi(codice) → { uid, chiavi } : accesso e cose del telefono sono al loro posto (poi si riapre la pagina)
  function ricevi(codice) {
    if (!codiceValido(codice)) return Promise.reject(new Error("codice"));
    return idDi(codice).then(function (id) {
      return fetch(DOCS + "/" + id + "?key=" + KEY).then(function (r) {
        if (r.status === 404 || r.status === 403) throw new Error("non c'è");   // (scaduto: le regole non lo danno più)
        if (!r.ok) throw new Error("deposito " + r.status);
        return r.json();
      }).then(function (doc) {
        var f = doc.fields || {};
        if (!f.dati || !f.sale || !f.iv) throw new Error("non c'è");
        if (f.scade && Date.parse(f.scade.timestampValue) < Date.now()) throw new Error("non c'è");
        return chiave(codice, daB64(f.sale.bytesValue)).then(function (k) {
          return crypto.subtle.decrypt({ name: "AES-GCM", iv: daB64(f.iv.bytesValue) }, k, daB64(f.dati.bytesValue));
        }).then(function (chiaro) { return scomprimi(new Uint8Array(chiaro), +(f.z && f.z.integerValue) || 0); })
          .then(function (u8) { return JSON.parse(td.decode(u8)); })
          .then(function (p) { return metti(p).then(function (n) { return { uid: p.uid, chiavi: n, scade: f.scade ? Date.parse(f.scade.timestampValue) : 0 }; }); });
      });
    });
  }
  // rimette tutto al suo posto. Stesso profilo già qui: si aggiunge solo quello che manca (vince quello che c'è già);
  // nessun profilo o un altro: le cose arrivate prendono il posto di quelle che ci sono
  function metti(p) {
    return leggiAccesso().then(function (qui) {
      var stesso = !!(qui && qui.uid && qui.uid === p.uid), n = 0;
      Object.keys(p.ls || {}).forEach(function (k) {
        try { if (stesso && localStorage.getItem(k) != null) return; localStorage.setItem(k, p.ls[k]); n++; } catch (e) {}
      });
      if (stesso || !p.accesso) return n;
      var u = p.accesso; u.apiKey = KEY; u.appName = "[DEFAULT]";
      return scriviAccesso(u).then(function () { return n; });
    });
  }

  // ---------- all'apertura: c'è un codice nel link? ----------
  var inCorso = false;
  function codiceDalLink() { var m = /(?:^#|[#&])trasloco=([A-Za-z0-9-]+)/.exec(location.hash || ""); return m ? m[1] : null; }
  function senzaCodice() {
    var h = (location.hash || "").replace(/^#/, "").split("&").filter(function (x) { return x && !/^trasloco=/.test(x); }).join("&");
    return location.pathname + location.search + (h ? "#" + h : "");
  }
  function velo(testo) {
    var v = document.getElementById("sg-trasloco-velo");
    if (!v) {
      v = document.createElement("div"); v.id = "sg-trasloco-velo";
      v.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#0d1020;color:#f4f5fb;font:600 1.05rem system-ui,sans-serif;text-align:center;padding:24px";
      v.innerHTML = '<img src="app/icona.svg" width="96" height="96" alt="" style="border-radius:22px"><div id="sg-trasloco-tx"></div>';
      (document.body || document.documentElement).appendChild(v);
    }
    document.getElementById("sg-trasloco-tx").textContent = testo;
  }
  // prima(fai): fai() accende Firebase. Se c'è un trasloco nel link, prima si riceve e la pagina si riapre (fai non serve)
  function prima(fai) {
    var c = codiceDalLink();
    if (!c) return fai();
    inCorso = true;
    try { history.replaceState(null, "", senzaCodice()); } catch (e) {}   // (il codice non resta nell'indirizzo né nella cronologia)
    var vai = function () { location.reload(); };   // (l'indirizzo è già senza codice: cambiare solo il pezzo dopo il # non riaprirebbe la pagina)
    var mostra = function () { velo("📦 Arrivano le tue cose…"); };
    if (document.body) mostra(); else document.addEventListener("DOMContentLoaded", mostra);
    ricevi(c).then(function (r) {
      segnaArrivo(c, r);
      vai();
    }).catch(function () {
      try { localStorage.setItem(ARRIVO_K, JSON.stringify({ errore: 1, ora: Date.now() })); } catch (e) {}
      vai();
    });
  }

  function segnaArrivo(c, r) { try { localStorage.setItem(ARRIVO_K, JSON.stringify({ codice: bello(c), scade: r.scade, ora: Date.now(), chiavi: r.chiavi })); } catch (e) {} }
  // ---------- dopo l'arrivo: «Benvenuto in Revel House» e come reinstallare l'app ----------
  function iPhone() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function installata() { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }
  function ora(ms) { var d = new Date(ms); return d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes(); }
  function riquadro(titolo, righe, tasto) {
    var vv = document.querySelector(".conferma-sfondo"); if (vv && vv.parentNode) vv.parentNode.removeChild(vv);
    var sf = document.createElement("div"); sf.className = "conferma-sfondo trasloco-sfondo";
    var box = document.createElement("div"); box.className = "conferma-box trasloco-box"; box.setAttribute("role", "dialog");
    var t = document.createElement("div"); t.className = "conferma-domanda"; t.textContent = titolo; box.appendChild(t);
    righe.forEach(function (r) {
      if (!r) return;
      var d = document.createElement("div"); d.className = "conferma-nota" + (r.cls ? " " + r.cls : ""); d.textContent = r.t || r; box.appendChild(d);
    });
    var tt = document.createElement("div"); tt.className = "conferma-tasti";
    var b = document.createElement("button"); b.className = "btn btn-primario"; b.textContent = tasto || "Ho capito 👍";
    b.onclick = function () { if (sf.parentNode) sf.parentNode.removeChild(sf); };
    tt.appendChild(b); box.appendChild(tt); sf.appendChild(box);
    document.body.appendChild(sf);
    return sf;
  }
  function comeInstallare(codice, scade) {
    if (iPhone()) return [
      { t: "📲 Rimetti l'app sul telefono: in Safari tocca Condividi (il quadrato con la freccia ⬆️), poi «Aggiungi alla schermata Home»." },
      codice ? { t: "Su iPhone l'app nuova si apre vuota: tocca «📦 Ho un codice di trasloco» e scrivi " + codice.replace("-", "‑") + " (vale fino alle " + ora(scade) + ").", cls: "trasloco-codice" } : null,
      { t: "Poi la vecchia app SPeeD GAME la puoi togliere." }
    ];
    return [
      { t: "📲 Rimetti l'app sul telefono: tocca «📲 Installa l'app» in alto, oppure i tre puntini ⋮ del browser e «Installa app»." },
      { t: "Poi la vecchia app SPeeD GAME la puoi togliere: qui c'è già tutto." }
    ];
  }
  function dopoArrivo() {
    var a = null; try { a = JSON.parse(localStorage.getItem(ARRIVO_K) || "null"); } catch (e) {}
    if (!a || Date.now() - (a.ora || 0) > 10 * 60 * 1000) { try { localStorage.removeItem(ARRIVO_K); } catch (e) {} return; }
    try { localStorage.removeItem(ARRIVO_K); } catch (e) {}
    if (a.errore) return riquadro("🏠 SPeeD GAME ora si chiama Revel House", [
      "Le tue cose non sono arrivate (il codice è scaduto o manca la rete).",
      "Riapri la vecchia app SPeeD GAME: ti riporta qui con tutto. Oppure entra col tuo nome e la tua password."
    ]);
    riquadro("🏠 Benvenuto in Revel House!", [
      "SPeeD GAME ora si chiama Revel House. Il tuo profilo e le tue cose sono arrivati qui: non devi rifare niente."
    ].concat(installata() ? [] : comeInstallare(a.codice, a.scade)));
  }
  function avvia() { setTimeout(dopoArrivo, 1200); }   // (dopo che la prima schermata si è disegnata)
  if (!codiceDalLink()) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia); else avvia(); }

  window.SGTrasloco = {
    prima: prima, inCorso: function () { return inCorso; },
    prepara: prepara, ricevi: ricevi, segnaArrivo: segnaArrivo, codiceValido: codiceValido, bello: bello, ora: ora,
    leggiAccesso: leggiAccesso, cose: cose, riquadro: riquadro, comeInstallare: comeInstallare
  };
})();
