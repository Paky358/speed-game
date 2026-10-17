// IL CONTROLLO SEVERO DI «IL PREZZO È GIUSTO!» (dopo base.js, premi-a.js e premi-b.js):
//   await COPIONE.carica("prezzo/base.js"); await COPIONE.carica("prezzo/premi-a.js"); await COPIONE.carica("prezzo/premi-b.js");
//   await COPIONE.carica("prezzo/controllo.js"); await COPIONE.prova("pzc1")
// Partite INTERE giocate da un giocatore automatico che sa fare tutti e 5 i giochi a premi; ogni punto viene ricontato
// a mano (Offerta, gioco a premi, Ruota, giro bonus, Vetrina) e alla fine la somma deve tornare coi punti in classifica.
// Una guardia legge di continuo le scritte dei telefoni: prezzi all'italiana («1.129 €», «6,99 €»), niente «NaN», «undefined»,
// «omino», «tu vince».
//
// pzc1: 🤖 5 Bot difficili, 📺 Puntata a vista            pzc2: 🤖 1 Bot facile, 📺 Serata lunga, segrete (2 Ruote)
// pzc3: 🤖 3 Bot, 🎯 Puntata (10 oggetti)                  pzc4: 🤖 5 Bot, 🎯 Serata lunga, senza sforare, segrete
// pzc5: online in 2, 📺 Puntata: offerte assurde mandate a mano, tocchi doppi e veloci sul tastierino, 9.999.999 €,
//       Luca ricarica nel gioco a premi, «+1 €», Rivincita e «Cambia gioco» nella Sala
// pzc6: online in 4, 🎯 Veloce senza sforare: pareggio, tutti sopra (si rifà), Sara spegne il telefono a metà offerta,
//       Ada arriva tardi, l'host ricarica alla fine
// pzc7: online in 8, 📺 Puntata a vista (Ruota e Vetrina in 8)
// pzc8: stesso telefono in 2 (🎯 Veloce a vista) e in 6 (📺 Veloce segrete)
// pzc9: i giochi a premi che non sono ancora usciti nelle prove di questa scheda (Bot, uno per volta)
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, PZ = W.PZ;
  if (!PZ || !W.PZA || !W.PZB) throw new Error("prima carica prezzo/base.js, premi-a.js e premi-b.js");
  function vm(C) { return W.vmDi(C) || {}; }
  var USCITI = W.__pzcUsciti = W.__pzcUsciti || {};   // i giochi a premi usciti in questa scheda

  // ---------------- il giocatore automatico di tutto ----------------
  async function ag(nome, opz) {
    var f = false;
    try { f = await W.PZB.agisciB(nome, opz); } catch (e) {}
    if (f) return true;
    try { return await W.PZA.agisci(nome, opz); } catch (e) { return false; }
  }
  async function gioca(nomi, finito, opz) {
    opz = opz || {};
    var fino = Date.now() + (opz.ms || 600000), giri = 0;
    while (Date.now() < fino) {
      if (finito()) return true;
      var lista = typeof nomi === "function" ? nomi() : nomi;
      for (var i = 0; i < lista.length; i++) { try { await ag(lista[i], opz); } catch (e) {} }
      if (opz.ognuno) await opz.ognuno(++giri);
      await W.dorme(opz.passo || 300);
    }
    return finito();
  }
  // offerte a caso: a volte sotto, a volte sopra, a volte precise
  function offertaVaria(pr) { var r = Math.random(); return r < 0.12 ? pr : r < 0.3 ? pr * (1.05 + Math.random() * 0.4) : pr * (0.55 + Math.random() * 0.43); }

  // ---------------- la guardia delle scritte ----------------
  function guardia(nomi) {
    var guai = {}, id = setInterval(function () {
      nomi().forEach(function (n) {
        var w = W.finestra(n); if (!w || !w.document || !w.document.body) return;
        var nodi = w.document.querySelectorAll(".st-vista, .pz-pan, .schermata");
        [].forEach.call(nodi, function (x) {
          var t = x.innerText || "";
          var m = /\d\.\d{1,2} ?€/.exec(t) || /\d{4,} ?€/.exec(t) || /NaN|undefined|\bnull\b|\[object|omino|tu vince|Tu vince|tu si porta/.exec(t) || /\d,\d{3} ?€/.exec(t);
          if (m) guai[n + ": «" + t.slice(Math.max(0, m.index - 25), m.index + 20).replace(/\s+/g, " ") + "»"] = 1;
        });
      });
    }, 700);
    return { ferma: function () { clearInterval(id); return Object.keys(guai); } };
  }

  // ---------------- i punti ricontati a mano ----------------
  function passo(p) { return p < 2 ? 0.05 : p < 20 ? 0.1 : p < 100 ? 1 : p < 1000 ? 5 : p < 10000 ? 50 : 500; }
  function marg(p, pct) { return Math.max(p * (pct || 0.02), passo(p)); }
  function r2(v) { return Math.round(v * 100) / 100; }
  // la mia Offerta: off = { id: v }
  function mieOfferte(prezzo, off, senza, molt, n, scala, bonus, pct) {
    var mg = marg(prezzo, pct), out = {};
    var righe = Object.keys(off).map(function (id) { var v = r2(off[id]), d = Math.abs(v - prezzo); return { id: id, d: d, sopra: v > prezzo + mg + 1e-9, giusto: d <= mg + 1e-9 }; });
    var cand = righe.filter(function (r) { return !(senza && r.sopra); });
    righe.forEach(function (r) {
      var ok = cand.indexOf(r) >= 0, pos = ok ? 1 + cand.filter(function (q) { return q.d < r.d - 1e-9; }).length : 0;
      var p = pos === 1 ? scala[0] : pos === 2 ? scala[1] : pos === 3 && n >= 4 ? scala[2] : 0;
      out[r.id] = p * molt + (r.giusto && pos ? bonus * molt : 0);
    });
    return out;
  }
  function mieRuota(g, ids) {
    var out = {}, righe = ids.map(function (id) { var x = g[id] || {}, tot = (x.v1 || 0) + (x.v2 || 0); return { id: id, tot: tot }; });
    var cand = righe.filter(function (r) { return r.tot > 0 && r.tot <= 100; });
    righe.forEach(function (r) {
      var ok = cand.indexOf(r) >= 0, pos = ok ? 1 + cand.filter(function (q) { return q.tot > r.tot; }).length : 0;
      out[r.id] = (pos === 1 ? 300 : pos === 2 ? 150 : pos === 3 && ids.length >= 4 ? 75 : 0) + (r.tot === 100 ? 1000 : 0);
    });
    return out;
  }
  // la spia sull'host: ricontа ogni passo appena arriva la rivelazione e somma tutto
  function contabile(nomeHost) {
    var w = W.finestra(nomeHost || "Paky"), visti = {}, somma = {}, male = [], log = [], premi = {}, conti = { off: 0, premio: 0, ruota: 0, bonus: 0, vetrina: 0, giusti: 0, cattivi: 0, sopra: 0, tutto: 0, cento: 0, pari: 0 };
    function aggiungi(m) { Object.keys(m).forEach(function (id) { somma[id] = (somma[id] || 0) + (m[id] || 0); }); }
    function confronta(cosa, mio, suo) {
      Object.keys(mio).concat(Object.keys(suo)).forEach(function (id) { if ((mio[id] || 0) !== (suo[id] || 0)) male.push(cosa + ": " + id + " " + (suo[id] || 0) + " invece di " + (mio[id] || 0)); });
    }
    var id = setInterval(function () {
      var H = w && w.__prezzoH; if (!H || !H.imp) return;
      var chiave = H.partita + "|" + H.k;
      if (visti[chiave]) return;
      var pres = H.players.filter(function (p) { return !p.via; }).length;
      if (H.fase === "offerta" && H.sotto === "sopra") { visti[chiave] = 1; conti.sopra++; }
      if (H.fase === "offerta" && H.sotto === "rivela" && H.esito) {
        visti[chiave] = 1; conti.off++;
        var tv = H.imp.formato === "tv", mio = mieOfferte(H.prod.prezzo, H.off, tv || H.imp.sforare, H.doppio ? 2 : 1, pres, [300, 150, 75], 500);
        var suo = {}; H.esito.righe.forEach(function (r) { suo[r.id] = r.punti; });
        confronta("Offerta " + H.iOff + " (" + H.prod.nome + " " + H.prod.prezzo + ")", mio, suo); aggiungi(suo);
        if (H.esito.giusti.length) conti.giusti++;
        if (H.esito.cattivo) conti.cattivi++;
        if (H.esito.vince.length > 1) conti.pari++;
        log.push("O" + H.iOff + (H.doppio ? "×2" : "") + ": " + H.prod.prezzo + " ← " + Object.keys(H.off).map(function (k) { return k + "=" + H.off[k] + "(" + (suo[k] || 0) + ")"; }).join(" "));
      }
      if (H.fase === "premio" && H.sotto === "riv" && H.premio) {
        visti[chiave] = 1; conti.premio++;
        var t = H.premio.tipo; premi[t] = (premi[t] || 0) + 1; USCITI[t] = (USCITI[t] || 0) + 1;
        aggiungi(H.premio.punti || {});
        Object.keys(H.premio.punti || {}).forEach(function (k) { var p = H.premio.punti[k]; if (!(p >= 0 && p <= 2000)) male.push(t + ": punti strani " + k + "=" + p); });
        log.push("P " + t + ": " + JSON.stringify(H.premio.punti));
      }
      if (H.fase === "ruota" && H.sotto === "riv" && H.ruota && H.ruota.esito) {
        visti[chiave] = 1; conti.ruota++;
        var ids = H.ruota.esito.righe.map(function (r) { return r.id; });
        var mioR = mieRuota(H.ruota.g, ids), suoR = {}; H.ruota.esito.righe.forEach(function (r) { suoR[r.id] = r.punti; });
        confronta("Ruota", mioR, suoR); aggiungi(suoR);
        if (H.ruota.esito.cento.length) conti.cento++;
        log.push("R: " + ids.map(function (k) { var x = H.ruota.g[k]; return k + "=" + x.v1 + "+" + (x.v2 || 0) + "(" + suoR[k] + ")"; }).join(" "));
      }
      if (H.fase === "ruota" && H.sotto === "rivb" && H.ruota && H.ruota.esitoB) {
        visti[chiave] = 1; conti.bonus++;
        var suoB = {}, mioB = {};
        H.ruota.esitoB.righe.forEach(function (r) { suoB[r.id] = r.punti; mioB[r.id] = r.b === 100 ? 1000 : (r.b === 5 || r.b === 15) ? 500 : 0; });
        confronta("Giro bonus", mioB, suoB); aggiungi(suoB);
      }
      if (H.fase === "vetrina" && H.sotto === "riv" && H.vet && H.vet.esito) {
        visti[chiave] = 1; conti.vetrina++;
        var tot = r2(H.vet.v.pezzi.reduce(function (a, x) { return a + x.prezzo; }, 0));
        var mioV = mieOfferte(tot, H.vet.off, true, 1, pres, [900, 450, 225], 0, 0.03), mg = marg(tot, 0.03);
        Object.keys(H.vet.off).forEach(function (k) { var v = H.vet.off[k]; if (v <= tot + mg + 1e-9 && v >= tot * 0.95) { mioV[k] += 1500; conti.tutto++; } });
        var suoV = {}; H.vet.esito.righe.forEach(function (r) { suoV[r.id] = r.punti; });
        confronta("Vetrina (" + tot + ")", mioV, suoV); aggiungi(suoV);
        log.push("V " + tot + " ← " + JSON.stringify(H.vet.off) + " " + JSON.stringify(suoV));
      }
      if (H.fase === "fine" && H.classifica) {
        visti[chiave] = 1;
        H.players.forEach(function (p) { if ((somma[p.id] || 0) !== p.punti) male.push("totale di " + p.nome + ": " + p.punti + " invece di " + (somma[p.id] || 0)); });
        // la classifica: ordinata e coi posti giusti
        var cl = H.classifica;
        for (var i = 1; i < cl.length; i++) if (!cl[i].via && !cl[i - 1].via && cl[i].punti > cl[i - 1].punti) male.push("classifica fuori ordine");
        cl.forEach(function (r) { if (!r.via && r.pos !== 1 + cl.filter(function (q) { return !q.via && q.punti > r.punti; }).length) male.push("posto sbagliato di " + r.nome); });
      }
    }, 60);
    return { ferma: function () { clearInterval(id); }, male: male, log: log, premi: premi, conti: conti, somma: somma,
      riassunto: function () { return Object.keys(conti).filter(function (k) { return conti[k]; }).map(function (k) { return k + " " + conti[k]; }).join(", ") + " · premi " + JSON.stringify(premi); } };
  }
  function errori() { var e = W.erroriTel(); return e.length ? " · ERRORI: " + e.slice(0, 3).join(" / ") : ""; }
  function chiudi(c, g) { c.ferma(); var gg = g.ferma(); var guai = c.male.slice(0, 6).concat(gg.slice(0, 6)); if (guai.length) no(guai.join(" ‖ ") + " · " + c.riassunto()); }
  // le fasi viste
  function fasi(nomeHost) { return PZ.spiaFasi(nomeHost || "Paky"); }

  // ---------------- 🤖 contro il Bot, una partita intera ----------------
  async function partitaBot(imp, opz) {
    opz = opz || {};
    var w = await PZ.contrBot(imp);
    if (opz.prima) opz.prima(w);
    var c = contabile("Paky"), g = guardia(function () { return ["Paky"]; }), sp = fasi("Paky");
    var ok = await gioca(["Paky"], function () { return w.__prezzoH.fase === "fine" && /Rivincita|Rigioca|Gioca ancora|Classifica|Serata/i.test(T(w)) && !w.document.querySelector(".st-vista"); },
      { ms: opz.ms || 1500000, offerta: offertaVaria, bravura: 0.6 });
    sp.ferma();
    if (!ok) { c.ferma(); g.ferma(); no("la partita non arriva alla fine (fase " + w.__prezzoH.fase + "." + w.__prezzoH.sotto + "; " + sp.viste.slice(-8).join(" → ") + ")"); }
    chiudi(c, g);
    var H = w.__prezzoH;
    return { w: w, H: H, c: c, viste: sp.viste, testo: c.riassunto() + " · classifica " + H.classifica.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") };
  }
  function conta(viste, x) { return viste.filter(function (f) { return f === x; }).length; }

  COPIONE.aggiungi("pzc1", { nome: "Prezzo controllo: 🤖 5 Bot difficili, 📺 Puntata a vista, punti ricontati", fai: async function () {
    var r = await partitaBot({ formato: "tv", durata: "puntata", offerte: "vista", liv: "difficile", nBot: 5 });
    if (r.c.conti.off < 3) no("Offerte giocate: " + r.c.conti.off);
    if (r.c.conti.premio !== 3) no("giochi a premi: " + r.c.conti.premio + " invece di 3");
    if (r.c.conti.ruota !== 1 || r.c.conti.vetrina !== 1) no("Ruota " + r.c.conti.ruota + ", Vetrina " + r.c.conti.vetrina);
    if (Object.keys(r.c.premi).length !== 3) no("in una puntata i 3 giochi a premi devono essere diversi: " + JSON.stringify(r.c.premi));
    return r.testo + errori();
  } });
  COPIONE.aggiungi("pzc2", { nome: "Prezzo controllo: 🤖 1 Bot facile, 📺 Serata lunga segrete (2 Ruote)", fai: async function () {
    var r = await partitaBot({ formato: "tv", durata: "lunga", offerte: "segrete", liv: "facile", nBot: 1 });
    if (r.c.conti.off < 4) no("Offerte giocate: " + r.c.conti.off);
    if (r.c.conti.premio !== 4) no("giochi a premi: " + r.c.conti.premio + " invece di 4");
    if (r.c.conti.ruota !== 2) no("Ruote: " + r.c.conti.ruota + " invece di 2");
    if (Object.keys(r.c.premi).length !== 4) no("4 giochi a premi diversi: " + JSON.stringify(r.c.premi));
    return r.testo + errori();
  } });
  COPIONE.aggiungi("pzc3", { nome: "Prezzo controllo: 🤖 3 Bot, 🎯 Solo il prezzo, Puntata (10 oggetti)", fai: async function () {
    var r = await partitaBot({ formato: "solo", durata: "puntata", offerte: "vista", liv: "medio", nBot: 3 });
    if (r.H.iOff !== 10 || r.c.conti.off !== 10) no("oggetti: " + r.H.iOff + " / rivelati " + r.c.conti.off);
    if (r.c.conti.premio || r.c.conti.ruota || r.c.conti.vetrina) no("in Solo il prezzo niente giochi a premi, Ruota o Vetrina");
    if (conta(r.viste, "punti") < 3) no("classifiche intermedie: " + conta(r.viste, "punti"));
    return r.testo + errori();
  } });
  COPIONE.aggiungi("pzc4", { nome: "Prezzo controllo: 🤖 5 Bot, 🎯 Serata lunga senza sforare, segrete", fai: async function () {
    var r = await partitaBot({ formato: "solo", durata: "lunga", offerte: "segrete", sforare: true, liv: "medio", nBot: 5 });
    if (r.H.iOff !== 15) no("oggetti: " + r.H.iOff);
    return r.testo + errori();
  } });

  // ---------------- online ----------------
  function conSpia() { PZ.conSpia(); }
  function senzaSpia() { PZ.senzaSpia(); }
  function idDi(C, nome) { var p = (vm(C).players || []).filter(function (x) { return x.nome === nome; })[0]; return p && p.id; }
  function tasto(w, tx) { return [].filter.call(w.document.querySelectorAll(".pz-pan.su .pz-k"), function (x) { return x.textContent.trim() === tx; })[0]; }
  function tocca(w, b) { if (!b) return false; b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "touch" })); return true; }
  function dispDi(w) { var v = w.document.querySelector(".pz-pan.su .pz-disp .v"); return v ? v.textContent.trim() : ""; }

  COPIONE.aggiungi("pzc5", { nome: "Prezzo controllo online in 2: offerte assurde, tocchi doppi, ricarica, «+1 €», Rivincita e Cambia gioco", fai: async function () {
    conSpia();
    try {
      var X = await PZ.salaPrezzo(["Luca"], { formato: "tv", durata: "puntata", offerte: "vista" }), C = X.C, P = X.P, note = [];
      var c = contabile("Paky"), g = guardia(function () { return ["Paky", "Luca"]; }), sp = fasi("Paky");
      // 1) la prima Offerta: Luca manda a mano offerte assurde (nessuna deve valere), poi prova il tastierino
      if (!await W.aspetta(function () { return vm(C).fase === "offerta" && vm(C).sotto === "offri"; }, 40000)) no("non si arriva alla prima Offerta");
      var L = W.finestra("Luca"), rete = W.reteDi("Luca"), k = vm(C).k;
      if (!rete) no("non trovo la rete di Luca");
      [0, -5, 99999999, 1e7, "abc", null, NaN, 1e300, "12; DROP"].forEach(function (v) { rete.invia({ t: "offerta", k: k, v: v }); });
      rete.invia({ t: "offerta", k: k - 1, v: 50 });   // un passo vecchio
      rete.invia({ t: "vetrina", k: k, v: 10 }); rete.invia({ t: "spinta", k: k, f: 1 }); rete.invia({ t: "scelta", k: k, g: "plinko" }); rete.invia({ t: "premio", k: k, m: { x: 1 } });
      await W.dorme(1500);
      var H = P.__prezzoH;
      if (H.off[idDi(C, "Luca")] != null) no("un'offerta assurda è stata presa: " + H.off[idDi(C, "Luca")]);
      // il tastierino: tocchi doppi e veloci
      if (!await W.aspetta(function () { return tasto(L, "9"); }, 8000)) no("Luca non ha il tastierino");
      for (var i = 0; i < 12; i++) tocca(L, tasto(L, "9"));
      if (dispDi(L) !== "9.999.999 €") no("dopo 12 «9» il display dice «" + dispDi(L) + "» (al massimo 7 cifre: 9.999.999 €)");
      for (i = 0; i < 9; i++) tocca(L, tasto(L, "⌫"));
      tocca(L, tasto(L, "000"));
      if (/000/.test(dispDi(L))) no("«000» su un display vuoto: «" + dispDi(L) + "»");
      tocca(L, tasto(L, "0")); tocca(L, tasto(L, "0"));
      if (dispDi(L) !== "0 €" && dispDi(L) !== "0,00 €") note.push("dopo «0 0» il display dice «" + dispDi(L) + "»");
      var okB = L.document.querySelector(".pz-pan.su .pz-ok");
      if (!okB.disabled) no("con 0 € si può offrire");
      // un prezzo vero, poi «Offro!» toccato tre volte di fila: un'offerta sola
      var pr = H.prod.prezzo, mio = pr < 20 ? Math.max(1, Math.floor(pr * 0.8)) : Math.floor(pr * 0.8);
      String(mio).split("").forEach(function (ch) { tocca(L, tasto(L, ch)); });
      var mandate = 0, inv = rete.invia; rete.invia = function (m) { if (m && m.t === "offerta") mandate++; return inv.apply(this, arguments); };
      tocca(L, okB); tocca(L, okB); okB.click(); tocca(L, okB);
      await W.dorme(1500);
      rete.invia = inv;
      if (mandate !== 1) no("«Offro!» toccato 4 volte: mandate " + mandate + " offerte");
      if (H.off[idDi(C, "Luca")] !== mio) no("l'offerta di Luca è " + H.off[idDi(C, "Luca")] + " invece di " + mio);
      // Paky fa il «+1 €» su Luca toccando la sua offerta nella riga
      var ch = await W.aspetta(function () { return [].filter.call(P.document.querySelectorAll(".pz-pan.su .pz-offch"), function (b) { return /Luca/.test(b.textContent); })[0]; }, 5000);
      if (!ch) no("Paky non vede l'offerta di Luca da toccare per il «+1 €»");
      tocca(P, ch);
      var atteso = r2(mio + (pr < 20 ? 0.1 : 1));
      if (dispDi(P) !== P.SGPrezzoScena.fmtE(atteso)) no("«+1 €»: il display di Paky dice «" + dispDi(P) + "» invece di «" + P.SGPrezzoScena.fmtE(atteso) + "»");
      tocca(P, P.document.querySelector(".pz-pan.su .pz-ok"));
      if (!await W.aspetta(function () { return H.sotto === "rivela"; }, 8000)) no("con tutti e due che hanno offerto non si va subito alla rivelazione");
      if (atteso <= pr + marg(pr) && !(H.esito.cattivo && H.esito.cattivo.chi === "host")) no("il «+1 €» cattivo non è stato visto: " + JSON.stringify(H.esito));
      // 2) il resto della partita; Luca ricarica nel primo gioco a premi
      var ricaricato = false;
      var ok = await gioca(["Paky", "Luca"], function () { return vm(C).fase === "fine"; }, { ms: 900000, offerta: offertaVaria, ognuno: async function () {
        if (!ricaricato && H.fase === "premio" && H.sotto === "gioca" && Date.now() % 3 === 0) {
          ricaricato = true;
          var w2 = await W.ricarica("Luca");
          if (!await W.aspetta(function () { return w2.document.querySelector(".st-vista"); }, 15000)) note.push("Luca dopo la ricarica non torna nello studio");
          else if (H.fase === "premio" && H.sotto === "gioca" && !await W.aspetta(function () { return w2.document.querySelector(".pz-pan.su") || H.sotto !== "gioca" || /Fatto/.test(T(w2)); }, 8000)) no("Luca ricaricato nel gioco a premi non ritrova il suo pannello (" + T(w2).slice(-120) + ")");
        }
      } });
      sp.ferma();
      if (!ok) no("la partita in 2 non finisce (" + vm(C).fase + "." + vm(C).sotto + " · " + sp.viste.slice(-6).join(" → ") + ")");
      if (!ricaricato) note.push("(Luca non ha ricaricato)");
      chiudi(c, g);
      // 3) la fine: tasti del core, Rivincita col 3-2-1, poi «Cambia gioco»
      await W.aspetta(function () { return (A.tastiFineDi(P) || []).length; }, 30000);
      var tf = A.tastiFineDi(P) || [];
      if (!tf.some(function (x) { return /Rivincita/.test(x); }) || !tf.some(function (x) { return /Cambia gioco/.test(x); })) no("tasti di fine dell'host: " + JSON.stringify(tf));
      var cl = vm(C).classifica || []; if (cl.length !== 2) no("classifica: " + JSON.stringify(cl));
      W.clicca(P, /Rivincita/); W.clicca(W.finestra("Luca"), /Ci sto/);
      if (!await W.aspetta(function () { return vm(C).fase === "apertura"; }, 25000)) no("la Rivincita non riparte (fase " + vm(C).fase + ")");
      // si chiude la rivincita dal ‹ e si cambia gioco: tutti tornano nella Sala
      await W.dorme(2000);
      var esci = P.document.querySelector(".st-esci, .st-indietro, [aria-label='Esci']");
      if (esci) esci.click(); await W.dorme(800);
      if (!await W.aspetta(function () { return /Quale gioco|Cambia gioco|Sala/.test(T(P)) && !P.document.querySelector(".st-vista"); }, 15000)) note.push("dopo ‹ dalla rivincita l'host non torna nella Sala (" + T(P).slice(0, 100) + ")");
      return c.riassunto() + " · " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + " " + note.join(" ") + errori();
    } finally { senzaSpia(); }
  } });

  COPIONE.aggiungi("pzc6", { nome: "Prezzo controllo online in 4: pareggio, tutti sopra, telefono spento a metà offerta, chi arriva tardi, host che ricarica", fai: async function () {
    conSpia();
    try {
      var amici = ["Luca", "Sara", "Giulia"];
      var X = await PZ.salaPrezzo(amici, { formato: "solo", durata: "veloce", offerte: "segrete", sforare: true }), C = X.C, P = X.P, S = X.S, note = [];
      var c = contabile("Paky"), g = guardia(function () { return ["Paky"].concat(amici); }), sp = fasi("Paky"), H = P.__prezzoH;
      var tutti = ["Paky"].concat(amici);
      // oggetto 1: tutti la stessa offerta (pareggio a 4)
      // oggetto 2: tutti sopra → «Si rifà», poi tutti sotto il limite
      // oggetto 3: Sara spegne il telefono dopo aver offerto, Giulia lo spegne prima di offrire; tornano dopo 8 s
      var spenti = false, accesi = false, adaArrivata = false;
      var opz = { ms: 600000, passo: 300, offerta: function (pr, H2) {
        if (H2.iOff === 1) return pr * 0.9;
        if (H2.iOff === 2 && !H2.rifai) return pr * (1.5 + Math.random());
        return offertaVaria(pr);
      }, ognuno: async function () {
        if (H.iOff === 3 && H.sotto === "offri" && !spenti && H.off[idDi(C, "Sara")] != null) { spenti = true; W.spegni("Sara"); W.spegni("Giulia"); H.__spentiK = H.k; setTimeout(function () { W.riaccendi("Sara"); W.riaccendi("Giulia"); accesi = true; }, 8000); }
        if (H.iOff === 4 && !adaArrivata) { adaArrivata = true; await W.apriTel("Ada", { hash: "sala=" + S, x: 740, salaSempre: true }); }
      } };
      var vivi = function () { return tutti.filter(function (n) { return !spenti || accesi || (n !== "Sara" && n !== "Giulia"); }).concat(adaArrivata ? ["Ada"] : []); };
      var ok = await gioca(vivi, function () { return vm(C).fase === "fine"; }, opz);
      sp.ferma();
      if (!ok) no("la partita in 4 non finisce (" + vm(C).fase + "." + vm(C).sotto + ")");
      chiudi(c, g);
      var log = c.log.join(" ‖ ");
      if (!c.conti.pari) no("nessun pareggio nell'oggetto 1 (" + log.slice(0, 300) + ")");
      if (!c.conti.sopra) no("tutti sopra non ha fatto «Si rifà» (" + log.slice(0, 400) + ")");
      if (sp.viste.indexOf("offerta.sopra") < 0) no("non si è passati da «😱 Tutti sopra!»");
      // Sara e Giulia: tornate in partita coi loro punti
      ["Sara", "Giulia"].forEach(function (n) { var p = H.players.filter(function (x) { return x.nome === n; })[0]; if (!p || p.via) no(n + " dopo il telefono spento non è in partita"); });
      // Ada arrivata tardi: guarda o entra al prossimo oggetto; non deve rompere niente
      var inP = (vm(C).players || []).some(function (p) { return p.nome === "Ada"; });
      note.push(inP ? "Ada è entrata in partita" : "Ada ha guardato (" + JSON.stringify(vm(C).guarda) + ")");
      var cl = vm(C).classifica || [];
      // l'host ricarica sulla classifica: si torna nella Sala / saletta, stesso codice
      await W.dorme(6000);
      await W.ricarica("Paky");
      if (!await W.aspetta(function () { var w = W.finestra("Paky"); return w && !w.document.querySelector(".st-vista") && /Sala|saletta|Quale gioco|Comincia|codice/i.test(T(w)); }, 25000)) no("dopo la ricarica dell'host sulla classifica non si torna nella Sala (" + T(W.finestra("Paky")).slice(0, 120) + ")");
      return c.riassunto() + " · " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + " · " + note.join(" ") + errori();
    } finally { senzaSpia(); }
  } });

  COPIONE.aggiungi("pzc7", { nome: "Prezzo controllo online in 8: 📺 Puntata a vista", fai: async function () {
    conSpia();
    try {
      var amici = ["Luca", "Sara", "Giulia", "Marco", "Bea", "Toni", "Ada"];
      var X = await PZ.salaPrezzo(amici, { formato: "tv", durata: "puntata", offerte: "vista" }), C = X.C;
      var c = contabile("Paky"), g = guardia(function () { return ["Paky", "Luca", "Toni"]; }), sp = fasi("Paky");
      var ok = await gioca(["Paky"].concat(amici), function () { return vm(C).fase === "fine"; }, { ms: 1200000, offerta: offertaVaria, passo: 200 });
      sp.ferma();
      if (!ok) no("la puntata in 8 non finisce (" + vm(C).fase + "." + vm(C).sotto + ")");
      chiudi(c, g);
      var cl = vm(C).classifica || [];
      if (cl.length !== 8) no("classifica in 8: " + cl.length);
      if (c.conti.premio !== 3) no("giochi a premi in 8: " + c.conti.premio);
      // «🎮 Cambia gioco»: l'host sceglie un altro gioco, gli amici tornano nella Sala
      var P = X.P; await W.aspetta(function () { return (A.tastiFineDi(P) || []).length; }, 30000);
      var tf = A.tastiFineDi(P) || [];
      if (!tf.some(function (x) { return /Cambia gioco/.test(x); })) no("niente «🎮 Cambia gioco» (" + JSON.stringify(tf) + ")");
      W.clicca(P, /Cambia gioco/);
      if (!await W.aspetta(function () { return /Quale gioco|Scegli il gioco/i.test(T(P)); }, 15000)) no("dopo «Cambia gioco» l'host non sceglie il gioco (" + T(P).slice(0, 120) + ")");
      if (!await W.aspetta(function () { var L = W.finestra("Luca"); return !L.document.querySelector(".st-vista") && /Sala|sceglie|Aspett/i.test(T(L)); }, 15000)) no("dopo «Cambia gioco» Luca non torna nella Sala (" + T(W.finestra("Luca")).slice(0, 120) + ")");
      return c.riassunto() + " · " + cl.map(function (r) { return r.pos + "° " + r.nome + " " + r.punti; }).join(", ") + errori();
    } finally { senzaSpia(); }
  } });

  COPIONE.aggiungi("pzc8", { nome: "Prezzo controllo: stesso telefono in 2 (🎯 Veloce a vista) e in 6 (📺 Veloce segrete)", fai: async function () {
    var esiti = [];
    var prove = [[["Luca"], { formato: "solo", durata: "veloce", offerte: "vista" }], [["Luca", "Sara", "Giulia", "Marco", "Bea"], { formato: "tv", durata: "veloce", offerte: "segrete" }]];
    for (var q = 0; q < prove.length; q++) {
      A.pulisci();
      var w = await PZ.stessoTelefono(prove[q][0], prove[q][1]);
      if (!await W.aspetta(function () { return W.clicca(w, /Comincia/); }, 4000)) no("non trovo «Comincia» (" + T(w).slice(0, 200) + ")");
      if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 5000)) no("la partita non comincia");
      var c = contabile("Paky"), g = guardia(function () { return ["Paky"]; }), sp = fasi("Paky"); W.__pzTurni = [];
      var ok = await gioca(["Paky"], function () { return w.__prezzoH.fase === "fine" && !w.document.querySelector(".st-vista"); }, { ms: 1200000, offerta: offertaVaria });
      sp.ferma();
      if (!ok) no("stesso telefono in " + (prove[q][0].length + 1) + ": non finisce (" + sp.viste.slice(-6).join(" → ") + ")");
      chiudi(c, g);
      var chi = {}; W.__pzTurni.forEach(function (x) { var m = /Sono (\S+)/.exec(x); if (m) chi[m[1]] = 1; });
      if (Object.keys(chi).length !== prove[q][0].length + 1) no("il telefono non è passato a tutti: " + Object.keys(chi).join(", "));
      esiti.push((prove[q][0].length + 1) + " giocatori: " + W.__pzTurni.length + " passaggi · " + c.riassunto());
    }
    return esiti.join(" ‖ ") + errori();
  } });

  // i giochi a premi che mancano: una puntata ⚡ col Bot con SOLO quelli (uno per volta)
  COPIONE.aggiungi("pzc9", { nome: "Prezzo controllo: i giochi a premi non ancora usciti (🤖)", fai: async function () {
    var tutti = ["piuomeno", "alpinista", "ordine", "troppo", "plinko"], mancano = tutti.filter(function (x) { return !USCITI[x]; }), esiti = [];
    if (!mancano.length) return "tutti e 5 già usciti: " + JSON.stringify(USCITI);
    for (var q = 0; q < mancano.length; q++) {
      A.pulisci();
      var tipo = mancano[q];
      var r = await partitaBot({ formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 3 }, { prima: function (w) { Object.keys(w.SG_PREZZO_PREMI).forEach(function (k) { if (k !== tipo) delete w.SG_PREZZO_PREMI[k]; }); } });
      if (!r.c.premi[tipo]) no(tipo + " non è uscito: " + JSON.stringify(r.c.premi));
      esiti.push(tipo + ": " + r.testo);
    }
    return esiti.join(" ‖ ") + errori();
  } });

  // pzc10: le misure a 360x640 e 412x915 con tutti i giochi a premi (Bot in 5, 📺 Serata lunga a vista): niente scorre,
  // niente sotto il pannello o fuori di lato, e la testata del maxischermo non esce in alto (W.__pzcMisure = [[360, 640]] per una sola)
  COPIONE.aggiungi("pzc10", { nome: "Prezzo controllo: le misure con tutti i giochi a premi", fai: async function () {
    var esiti = [], misure = W.__pzcMisure || [[360, 640], [412, 915]];
    for (var m = 0; m < misure.length; m++) {
      A.pulisci();
      var wh = misure[m], w = await PZ.contrBot({ formato: "tv", durata: "lunga", offerte: "vista", liv: "medio", nBot: 5 });
      var f = document.getElementById("tel-Paky"); f.style.width = wh[0] + "px"; f.style.height = wh[1] + "px"; w.dispatchEvent(new w.Event("resize"));
      var st = w.document.createElement("style"); st.textContent = "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}"; w.document.head.appendChild(st);
      var visti = {}, guai = {}, premi = {};
      await gioca(["Paky"], function () { return w.__prezzoH.fase === "fine"; }, { ms: 1500000, offerta: offertaVaria, ognuno: async function () {
        var H = w.__prezzoH, k = H.fase + "." + (H.sotto || "") + (H.premio && H.fase === "premio" ? "." + H.premio.tipo : "");
        if (H.premio) premi[H.premio.tipo] = 1;
        if (visti[k] > 2) return;
        await W.dorme(1200);
        visti[k] = (visti[k] || 0) + 1;
        PZ.controllaVista(w).forEach(function (g) { guai[k + ": " + g] = 1; });
        var t = w.document.querySelector(".st-sch-in .pz-testa"), sch = w.document.querySelector(".st-sch-in");
        if (t && sch && w.document.querySelector(".st-mondo.st-quieto")) { var r = t.getBoundingClientRect(), rs = sch.getBoundingClientRect(); if (r.height && r.top < rs.top - 2) guai[k + ": la testata esce in alto (" + Math.round(r.top) + "<" + Math.round(rs.top) + ")"] = 1; }
      } });
      esiti.push(wh.join("x") + ": " + (Object.keys(guai).length ? Object.keys(guai).slice(0, 8).join(" | ") : "ok") + " (passi " + Object.keys(visti).length + ", premi " + Object.keys(premi).join(",") + ")");
    }
    if (esiti.some(function (e) { return !/: ok/.test(e); })) no(esiti.join(" ‖ "));
    return esiti.join(" ‖ ") + errori();
  } });

  // pzc11: online in 3, Sara spegne il telefono PRIMA di offrire e lo riaccende dopo 6 s: ritrova il tastierino e la sua offerta vale;
  //        poi ricarica la pagina DOPO aver offerto: ritrova «✅ Hai offerto…» (niente tastierino aperto)
  COPIONE.aggiungi("pzc11", { nome: "Prezzo controllo online in 3: telefono spento prima di offrire, ricarica dopo aver offerto", fai: async function () {
    conSpia();
    try {
      var X = await PZ.salaPrezzo(["Luca", "Sara"], { formato: "solo", durata: "veloce", offerte: "segrete" }), C = X.C, P = X.P, H = P.__prezzoH;
      if (!await W.aspetta(function () { return H.fase === "offerta" && H.sotto === "offri"; }, 40000)) no("non si arriva al primo oggetto");
      W.spegni("Sara");
      await gioca(["Paky", "Luca"], function () { return Object.keys(H.off).length >= 2; }, { ms: 15000 });
      await W.dorme(6000);
      W.riaccendi("Sara");
      var S = W.finestra("Sara"), idS = idDi(C, "Sara");
      if (!await W.aspetta(function () { return tasto(S, "5"); }, 10000)) no("Sara riaccesa non ha il tastierino (" + T(S).slice(-150) + ")");
      tocca(S, tasto(S, "5")); tocca(S, S.document.querySelector(".pz-pan.su .pz-ok"));
      if (!await W.aspetta(function () { return H.off[idS] === 5 || H.sotto !== "offri"; }, 8000) || H.off[idS] !== 5) no("l'offerta di Sara dopo il telefono spento non vale (" + JSON.stringify(H.off) + ", " + H.sotto + ")");
      // secondo oggetto: Sara offre e ricarica
      if (!await W.aspetta(function () { return H.iOff === 2 && H.sotto === "offri"; }, 40000)) no("non si arriva al secondo oggetto");
      if (!await W.aspetta(function () { return tasto(W.finestra("Sara"), "7"); }, 10000)) no("Sara non ha il tastierino al secondo oggetto");
      S = W.finestra("Sara"); tocca(S, tasto(S, "7")); tocca(S, S.document.querySelector(".pz-pan.su .pz-ok"));
      if (!await W.aspetta(function () { return H.off[idS] === 7; }, 6000)) no("la seconda offerta di Sara non arriva");
      S = await W.ricarica("Sara");
      if (!await W.aspetta(function () { return S.document.querySelector(".st-vista") && /Hai fatto la tua offerta|Hai offerto/.test(T(S)); }, 15000)) no("Sara ricaricata non legge «✅ Hai …offerto» (" + T(S).slice(-160) + ")");
      if (S.document.querySelector(".pz-pan.su .pz-k")) no("Sara ricaricata dopo aver offerto ha di nuovo il tastierino aperto");
      return "Sara: 5 € dopo il telefono spento, ricarica dopo aver offerto ok" + errori();
    } finally { senzaSpia(); }
  } });

  W.PZC = { ag: ag, gioca: gioca, guardia: guardia, contabile: contabile, partitaBot: partitaBot, offertaVaria: offertaVaria };
})();
