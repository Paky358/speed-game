// PROVE DEL PASSO 5 PER «IL PREZZO È GIUSTO!» (js/games/prezzo.js: riprende + riserva, dal 17 ott 2026).
// Uso (dopo copione-prova.js e prezzo/base.js, che dà il giocatore automatico W.PZ):
//   await COPIONE.carica("prezzo/base.js"); await COPIONE.carica("passo5/prezzo.js"); await COPIONE.prova("5pz1")
//   Edge invisibile: prova.js --porta 8978 --carica prezzo/base.js,passo5/prezzo.js --prova 5pz1,5pz2,5pz3 --timeout 900
// Tutte col percorso di prima (stanza di un gioco solo). Profili finti, mai account veri.
// 5pz1 🎯 Solo il prezzo ⚡ Veloce in 3: l'host ricarica a metà delle offerte del 2° oggetto → la partita RIPRENDE (niente
//      saletta, la pillola «🔁 Paky è tornato…»), prima la classifica «🔁 Si riprende!» (almeno 5 s), poi lo STESSO oggetto
//      da capo con le offerte vuote, stessi punti; poi si gioca fino alla fine: 6 oggetti, la partita (XP) una volta sola a
//      testa e un solo "__esito".
// 5pz2 📺 Come in TV ⚡ Veloce in 3: l'host ricarica mentre si scopre il prezzo della 1ª Offerta → la rivelazione si rivede
//      con lo stesso esito e i punti NON si danno due volte; poi ricarica di nuovo a metà del gioco a premi → classifica
//      «🔁 Si riprende!» e lo stesso gioco a premi da capo, stessi punti; poi si va avanti fino alla Ruota.
// 5pz3 Riserva 📺 Come in TV ⚡ Veloce in 4 (Giulia e Luca sono i vice): il telefono dell'host si spegne del tutto a metà
//      della 2ª Offerta → entro 8 s la partita la tiene Giulia (_g 2), stessi punti, «👑 … la porti avanti tu» e «👑 Ora la
//      partita la tiene Giulia»; Paky torna: «👋 Bentornato! … rientri come giocatore», rientra al suo posto coi suoi punti,
//      mai due host; si gioca fino alla classifica: XP una volta sola a testa (anche Paky), un solo "__esito" (di Giulia).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  function no(p) { throw new Error("NO: " + p); }
  function vm(C) { return W.vmDi(C) || {}; }
  function pill(w) { return w ? [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | ") : ""; }
  function PZ() { if (!W.PZ) no("manca prezzo/base.js (carica prima quello)"); return W.PZ; }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  // punti di tutti (per nome), come li dice la foto
  function punti(v) { return JSON.stringify((v.players || []).map(function (p) { return [p.nome, p.punti]; })); }
  // ogni telefono: le regole della prova (w.__imp, le legge chi apre) e il conto delle partite date (XP)
  function prima(imp) {
    return function (w) {
      w.__imp = imp;
      var nome = String((w.frameElement && w.frameElement.id) || "").replace(/^tel-/, "");
      A.contaPartite(nome)(w);
    };
  }
  // tutti i telefoni giocano (giocatore automatico di prezzo/base.js) finché fino(vm) non è vero
  async function gioca(C, nomi, fino, ms, host) {
    var ok = await PZ().giocaTutti(typeof nomi === "function" ? nomi() : nomi, function () { return fino(vm(C)); }, { ms: ms || 120000, host: host ? host() : "Paky" });
    return ok;
  }
  // come gioca, ma la lista dei telefoni e chi tiene la partita si rileggono a ogni giro
  async function giocaVivi(C, X, fino, ms, perche) {
    var t = Date.now() + (ms || 120000);
    while (Date.now() < t) {
      if (fino(vm(C))) return true;
      var h = X.tiene();
      for (var i = 0; i < X.vivi.length; i++) { try { await PZ().agisci(X.vivi[i], { host: h }); } catch (e) {} }
      await W.dorme(400);
    }
    no((perche || "non si arriva al punto della prova") + " (fase " + vm(C).fase + "." + vm(C).sotto + ")");
  }

  // ---------------- 5pz1: Solo il prezzo, l'host ricarica a metà delle offerte ----------------
  COPIONE.aggiungi("5pz1", { nome: "Prezzo · Solo il prezzo: l'host ricarica a metà delle offerte → stesso oggetto da capo, stessi punti; poi fino alla fine, XP una volta", fai: async function () {
    W.__partite = {};
    PZ().conSpia();
    try {
      var tutti = ["Paky", "Giulia", "Luca"], prod0 = null, respiroVisto = 0, t0r = 0;
      var r = await A.provaRipresa({ gioco: "prezzo", nomeTessera: "Il Prezzo è Giusto!", amici: ["Giulia", "Luca"],
        prima: prima({ formato: "solo", durata: "veloce", offerte: "vista" }),
        comincia: async function (C, P) {
          if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
          // il 1° oggetto si gioca tutto; ci si ferma quando compare il 2°
          if (!await gioca(C, tutti, function (v) { return v.fase === "offerta" && v.iOff === 2 && v.sotto === "prodotto"; }, 90000)) no("non si arriva al 2° oggetto (fase " + vm(C).fase + "." + vm(C).sotto + ")");
        },
        fase: function (v) { return v.fase === "offerta" && v.sotto === "offri" && v.iOff === 2; }, attesaFase: 15000,
        // Giulia offre (dalla rete), Luca e l'host no: la ricarica arriva a offerte a metà
        prepara: async function (C) {
          var v = vm(C); prod0 = v.prod;
          W.reteDi("Giulia").invia({ t: "offerta", v: 7, k: v.k });
          if (!await W.aspetta(function () { return ((vm(C).off || {})[A.mioId("Giulia")]) === 7; }, 4000)) no("l'offerta di Giulia non arriva");
        },
        controlla: function (a, b) {
          if (punti(b) !== punti(a)) return "punti cambiati: " + punti(a) + " → " + punti(b);
          if (b.fase === "punti" && b.rip) { if (!respiroVisto) { respiroVisto = Date.now(); } return true; }
          if (b.fase === "offerta" && b.iOff === 2) return true;
          return "fase " + b.fase + "." + b.sotto + " (oggetto " + b.iOff + ")";
        }, attesa: 12000 });
      var C = r.C, note = ["ripresa in " + r.dt + " s"];
      // il respiro: la classifica «🔁 Si riprende!» per almeno 5 secondi, poi lo stesso oggetto con le offerte vuote
      if (!await W.aspetta(function () { var v = vm(C); if (v.fase === "punti" && v.rip && !respiroVisto) respiroVisto = Date.now(); return v.fase === "offerta" && v.iOff === 2 && (v.sotto === "prodotto" || v.sotto === "offri"); }, 15000)) no("dopo il respiro non torna il 2° oggetto (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var dRes = respiroVisto ? (Date.now() - respiroVisto) / 1000 : 0;
      if (!respiroVisto) no("nessuna classifica «🔁 Si riprende!» prima di rifare l'oggetto");
      if (dRes < 4.5) no("il respiro è durato solo " + dRes.toFixed(1) + " s");
      if (!/Si riprende/.test(T(W.finestra("Giulia"))) && vm(C).sotto === "prodotto") note.push("(Giulia non ha visto «Si riprende!» scritto: già passata)");
      var v2 = vm(C);
      if (!v2.prod || v2.prod.id !== prod0.id) no("l'oggetto è cambiato: " + (prod0 && prod0.nome) + " → " + (v2.prod && v2.prod.nome));
      if (!await W.aspetta(function () { return vm(C).sotto === "offri"; }, 8000)) no("le offerte non si riaprono");
      if (Object.keys(vm(C).off || {}).length) no("dopo la ripresa le offerte non sono vuote: " + JSON.stringify(vm(C).off));
      note.push("respiro " + dRes.toFixed(1) + " s, stesso oggetto («" + prod0.nome + "»), offerte da capo");
      // Giulia vede di nuovo il tastierino (il suo telefono rifà il passo)
      if (!await W.aspetta(function () { return W.finestra("Giulia").document.querySelector(".pz-pan.su .pz-ok"); }, 6000)) no("Giulia non ha il tastierino per offrire di nuovo");
      // fino alla fine
      if (!await gioca(C, tutti, function (v) { return v.fase === "fine"; }, 240000)) no("dopo la ripresa la partita non arriva alla fine (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      await W.dorme(2500);
      var H = W.finestra("Paky").__prezzoH;
      if (H.iOff !== 6) no("oggetti giocati: " + H.iOff + " (dovevano essere 6)");
      var cl = vm(C).classifica || []; if (cl.length !== 3) no("classifica: " + JSON.stringify(cl));
      tutti.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (" + n + " doveva averne 1)"); });
      var es = A.contaStoria(C, '"__esito"'); if (es !== 1) no("gli __esito sono " + es);
      errori();
      return note.join(" · ") + " · fine: " + cl.map(function (x) { return x.pos + "° " + x.nome + " " + x.punti; }).join(", ") + " · XP una volta, un __esito";
    } finally { PZ().senzaSpia(); }
  } });

  // ---------------- 5pz2: Come in TV, ricarica sulla rivelazione e poi nel gioco a premi ----------------
  COPIONE.aggiungi("5pz2", { nome: "Prezzo · Come in TV: l'host ricarica mentre si scopre il prezzo (niente punti doppi) e poi nel gioco a premi (si rifà)", fai: async function () {
    W.__partite = {};
    PZ().conSpia();
    try {
      var tutti = ["Paky", "Giulia", "Luca"], note = [];
      var r = await A.provaRipresa({ gioco: "prezzo", nomeTessera: "Il Prezzo è Giusto!", amici: ["Giulia", "Luca"],
        prima: prima({ formato: "tv", durata: "veloce", offerte: "vista" }),
        comincia: async function (C, P) {
          if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
          if (!await gioca(C, tutti, function (v) { return v.fase === "offerta" && v.sotto === "rivela"; }, 90000)) no("non si arriva alla rivelazione della 1ª Offerta (fase " + vm(C).fase + "." + vm(C).sotto + ")");
        },
        fase: function (v) { return v.fase === "offerta" && v.sotto === "rivela" && v.esito; }, salva: 700,
        controlla: function (a, b) {
          if (punti(b) !== punti(a)) return "punti cambiati (dati due volte?): " + punti(a) + " → " + punti(b);
          if (b.fase !== "offerta" || b.sotto !== "rivela") return "fase " + b.fase + "." + b.sotto;
          if (b.k === a.k) return "la rivelazione non è ripartita (stesso passo)";
          return JSON.stringify(b.esito && b.esito.righe) === JSON.stringify(a.esito && a.esito.righe) ? true : "esito diverso";
        } });
      var C = r.C, pRiv = punti(r.prima);
      if (!/: [1-9]/.test(pRiv.replace(/"/g, " ")) && !/,[1-9]/.test(pRiv)) note.push("(nessuno ha preso punti alla 1ª Offerta)");
      note.push("rivelazione rivista con lo stesso esito (" + r.dt + " s), punti " + pRiv);
      // dopo la rivelazione si va avanti (scelta del gioco a premi o gioco a premi): punti ancora uguali
      if (!await W.aspetta(function () { var v = vm(C); return v.fase === "scegli" || v.fase === "premio" || v.fase === "punti"; }, 30000)) no("dopo la rivelazione rivista non si va avanti (fase " + vm(C).fase + ")");
      if (punti(vm(C)) !== pRiv) no("finita la rivelazione rivista i punti sono cambiati: " + pRiv + " → " + punti(vm(C)));
      // si arriva a metà del gioco a premi
      if (!await gioca(C, tutti, function (v) { return v.fase === "premio" && v.sotto === "gioca"; }, 60000)) no("non si arriva al gioco a premi (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      await W.dorme(1500);
      var a = vm(C), tipo = a.premio && a.premio.tipo, pA = punti(a), s0 = (W.statoStanza(C) || {})._s;
      if (!tipo) no("nella foto non c'è il gioco a premi");
      // ---- seconda ricarica dell'host ----
      var t1 = Date.now(), resp = 0, salette = {};
      await W.ricarica("Paky");
      var ok = await W.aspetta(function () {
        ["Giulia", "Luca"].forEach(function (n) { if (W.finestra(n).document.querySelector(".saletta-schermo")) salette[n] = 1; });
        var s = W.statoStanza(C) || {}, v = vm(C);
        if (!s._s || s._s === s0 || !s._r) return false;
        if (v.fase === "punti" && v.rip && !resp) resp = Date.now();
        return resp && v.fase === "premio" && v.premio && v.premio.tipo === tipo && A.contaDentro(v) === 3;
      }, 20000);
      if (!ok) no("seconda ricarica: il gioco a premi non riparte da capo dopo il respiro (fase " + vm(C).fase + "." + vm(C).sotto + ", tipo " + ((vm(C).premio || {}).tipo) + " invece di " + tipo + ", respiro " + !!resp + ")");
      if (Object.keys(salette).length) no(Object.keys(salette).join(", ") + " è passato dalla saletta");
      if (punti(vm(C)) !== pA) no("seconda ricarica: punti cambiati " + pA + " → " + punti(vm(C)));
      if (((vm(C).premio || {}).fatti || []).length) no("il gioco a premi rifatto ha già delle mosse: " + JSON.stringify(vm(C).premio.fatti));
      note.push("2ª ricarica nel gioco a premi (" + tipo + "): respiro e gioco da capo in " + ((Date.now() - t1) / 1000).toFixed(1) + " s, stessi punti");
      // si va avanti fino alla Ruota (passando per la classifica)
      if (!await gioca(C, tutti, function (v) { return v.fase === "ruota"; }, 150000)) no("dopo la seconda ripresa non si arriva alla Ruota (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      errori();
      return note.join(" · ") + " · poi fino alla Ruota (" + punti(vm(C)) + ")";
    } finally { PZ().senzaSpia(); }
  } });

  // ---------------- 5pz3: la riserva ----------------
  COPIONE.aggiungi("5pz3", { nome: "Prezzo · Riserva: l'host si spegne, Giulia porta avanti la partita; Paky torna da giocatore; fino alla classifica", fai: async function () {
    W.__partite = {};
    PZ().conSpia();
    try {
      var nomi = ["Paky", "Giulia", "Luca", "Sara"], amici = nomi.slice(1), L = [];
      var X = { ids: { Paky: "host" }, vivi: nomi.slice(), tiene: function () { var c = A.chiTiene(X.C); var n = null; Object.keys(X.ids).forEach(function (k) { if (X.ids[k] === (c.h || "host")) n = k; }); return n || "Paky"; } };
      var P = await W.apriTel("Paky", { x: 0, prima: prima({ formato: "tv", durata: "veloce", offerte: "vista" }) });
      X.C = await W.apriStanza(P, "Il Prezzo è Giusto!");
      var C = X.C;
      for (var i = 0; i < amici.length; i++) {
        var n = amici[i], k = i + 2;
        await W.apriTel(n, { hash: "gioco=prezzo&stanza=" + C, x: 185 * (i + 1), prima: prima(null) });
        if (!await W.aspetta(function () { return A.contaDentro(vm(C)) >= k; }, 10000)) no(n + " non entra in saletta");
        X.ids[n] = A.mioId(n);
        await W.dorme(300);
      }
      if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
      // si gioca fino alla 2ª Offerta e ci si ferma appena si aprono le offerte
      await giocaVivi(C, X, function (v) { return v.fase === "offerta" && v.iOff === 2 && v.sotto === "prodotto"; }, 200000, "non si arriva alla 2ª Offerta");
      if (!await W.aspetta(function () { return vm(C).sotto === "offri"; }, 8000)) no("le offerte della 2ª Offerta non si aprono");
      var v0 = vm(C);
      W.reteDi("Luca").invia({ t: "offerta", v: 3, k: v0.k });
      await W.dorme(1800);   // (la copia ai vice: al massimo una al secondo)
      var p0 = punti(vm(C)), prod0 = vm(C).prod, t0 = Date.now();
      // ---- Paky si spegne e non torna (per ora) ----
      var sent = (function () {
        var visti = [];
        var id = setInterval(function () { amici.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Collegamento perso|La stanza è chiusa|ha chiuso la/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 150);
        return { stop: function () { clearInterval(id); return visti; } };
      })();
      A.muore("Paky"); X.vivi = amici.slice();
      if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === X.ids.Giulia; }, 8000)) no("dopo 8 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
      var dt = ((Date.now() - t0) / 1000).toFixed(1);
      var pg = await A.pilloleDi(["Giulia"], /porti avanti tu/, 3000), pa = await A.pilloleDi(["Luca", "Sara"], /Ora la partita la tiene Giulia/, 4000);
      if (!pg.Giulia) no("Giulia non legge «… la porti avanti tu» («" + pill(W.finestra("Giulia")) + "»)");
      if (!pa.Luca || !pa.Sara) no("Luca e Sara non leggono «Ora la partita la tiene Giulia» (" + JSON.stringify(pa) + ")");
      L.push("Giulia tiene la partita in " + dt + " s");
      // la partita di Giulia: stessi punti, lo stesso oggetto da capo dopo il respiro
      if (!await W.aspetta(function () { var v = vm(C); return v.fase === "offerta" && v.iOff === 2 && A.chiTiene(C).h === X.ids.Giulia; }, 20000)) no("Giulia non rifà la 2ª Offerta (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      if (punti(vm(C)) !== p0) no("con Giulia i punti sono cambiati: " + p0 + " → " + punti(vm(C)));
      if (!vm(C).prod || vm(C).prod.id !== prod0.id) no("con Giulia l'oggetto è cambiato");
      var GH = W.finestra("Giulia").__prezzoH;
      if (!GH || GH.players.filter(function (p) { return p.id === X.ids.Giulia; }).length !== 1) no("Giulia non ha il suo posto nella partita che tiene");
      L.push("stessi punti e stesso oggetto");
      // ---- Paky torna dopo un po' (l'app era solo in secondo piano) ----
      await giocaVivi(C, X, function () { return Date.now() - t0 > 12000; }, 20000);
      var t1 = Date.now();
      A.torna("Paky");
      var pp = await A.pilloleDi(["Paky"], /Bentornato.*Giulia.*rientri come giocatore/, 9000);
      if (!pp.Paky) no("Paky non legge «👋 Bentornato! Ora la partita la tiene Giulia…» («" + pill(W.finestra("Paky")) + "»)");
      X.vivi = nomi.slice();
      await giocaVivi(C, X, function (v) { return (v.players || []).some(function (p) { return p.id === "host" && !p.via; }); }, 30000, "Paky non rientra al suo posto");
      L.push("Paky torna e rientra da giocatore");
      // ---- fino alla classifica ----
      await giocaVivi(C, X, function (v) { return v.fase === "fine"; }, 420000, "la partita tenuta da Giulia non arriva alla classifica");
      await W.dorme(3500);
      var altre = A.fotoDa(C, t1 + 2500).filter(function (x) { return x.h !== X.ids.Giulia; });
      if (altre.length) no("dopo il ritorno di Paky ci sono foto di un altro host: " + JSON.stringify(altre.slice(0, 3)));
      var c = A.chiTiene(C); if (c.g !== 2 || c.h !== X.ids.Giulia) no("alla fine la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
      var cl = vm(C).classifica || [];
      if (cl.length !== 4) no("classifica: " + JSON.stringify(cl));
      var rp = cl.filter(function (x) { return x.nome === "Paky"; })[0]; if (!rp || rp.via) no("Paky non è in classifica come giocatore: " + JSON.stringify(rp));
      if (!await W.aspetta(function () { return /Nuova partita|Rivincita/.test(T(W.finestra("Giulia"))); }, 20000)) no("Giulia (tiene la partita) non vede la classifica con «Nuova partita»");
      nomi.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (" + n + " doveva averne 1)"); });
      var es = (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/stato") >= 0 && x.p.indexOf('"__esito"') >= 0; });
      if (es.length !== 1 || es[0].da !== "Giulia") no("gli __esito sono " + es.length + " (" + es.map(function (x) { return x.da; }).join(", ") + "): doveva essere 1, di Giulia");
      var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
      errori();
      L.push("classifica: " + cl.map(function (x) { return x.pos + "° " + x.nome + " " + x.punti; }).join(", ") + "; XP una volta a testa, un __esito di Giulia, mai due host");
      return L.join(" · ");
    } finally { PZ().senzaSpia(); }
  } });

  COPIONE.gruppo5pz = async function () { var out = {}; for (var n of ["5pz1", "5pz2", "5pz3"]) out[n] = await COPIONE.prova(n); return out; };
})();
