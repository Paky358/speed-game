// PROVE CATTIVE "L'ASTA ONLINE: DUE TOCCHI = +2 SEMPRE" (controllo del 17 ott 2026, dopo il commit ff97f12).
// Rete finta cattiva: i messaggi arrivano dopo 100-900 ms, le mosse (rilancia/passa) anche IN DISORDINE e il 40% DOPPIE
// (lo stesso messaggio arriva due volte all'host); in 4-6 telefoni. Cerca di rompere: due tocchi = +2, salti che si sommano,
// doppioni che non contano due volte, crediti mai superati, la carta a chi ha davvero l'offerta più alta.
// Uso (dopo copione-prova.js; caricare prima asta-tocchi.js e asta.js, che mettono le loro spie):
//   await COPIONE.carica("preferiti/asta-tocchi.js"); await COPIONE.carica("preferiti/asta.js");
//   await COPIONE.carica("preferiti/asta-caos.js"); await COPIONE.prova("ck1")
//   (tutte: for (const n of ["ck1","ck2","ck3","ck4","ck5","ck6"]) await COPIONE.prova(n), circa 6 minuti)
//
// ck1 Temi in 5, rete cattiva: a turno 2 tocchi = +2, 3 = +3, +3 e +1 = +4, +3 e +3 = +6; poi due amici insieme (2 tocchi
//     ciascuno: sempre +2 esatti), due insieme coi salti (+3 e +1 contro +1 e +1: o +4 o +2, mai altro), tre insieme
//     (3 tocchi ciascuno: +3 esatti); doppioni rimandati; tutti vedono lo stesso; la carta al capo, crediti giusti.
// ck2 Temi in 4, pochi crediti: al massimo il +3 è spento, 4 tocchi fulminei arrivano al massimo e mai oltre, un messaggio
//     finto oltre il massimo non conta; si chiude da sola al massimo e i crediti restano giusti.
// ck3 Temi in 4: un amico ricarica la pagina subito dopo 2 tocchi (contano tutti e due), poi 2 tocchi = +2; ricarica a metà
//     tra un tocco e l'altro; ricarica con l'orologio del telefono indietro di 2 minuti: 2 tocchi = +2 lo stesso.
// ck4 Temi in 4: l'host ricarica (ripresa finta di Passo 5) coi tocchi degli amici per strada: il lotto riparte, i messaggi
//     vecchi non contano, poi 2 tocchi = +2.
// ck5 Temi in 3: due tocchi proprio all'ultimo secondo del martello (350, 200, 80 ms prima): o contano tutti e due (+2,
//     e il martello riparte) o nessuno (la carta al capo di prima, chi ha toccato non paga); mai +1; lo schermo torna giusto.
// ck6 Fantacalcio in 4, rete cattiva: due insieme «Lo prendo» + «Rialzo» = 2; +2 e +5 = +7; chi ha già il ruolo pieno non
//     ha tasti e un suo messaggio non conta; crediti e rose giuste calciatore dopo calciatore.
// ck7 Tocchi arrivati al contrario apposta (e doppi): chi guida, 2 rialzi al contrario = +2 (prima si perdevano tutti e due),
//     +3 +1 +1 al contrario = +5, 3 tocchi al contrario di chi non guida = +3; fantacalcio «Lo prendo» + «Rialzo» + «+5» = 7.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent.replace(/\s+/g, " ")) && visibile(b); })[0] || null; }
  function prezzo(w) { var b = q(w, ".sa-prezzo b, .st-prezzo b"); return b ? parseInt(b.textContent, 10) : null; }
  function chi(w) { var s = q(w, ".sa-prezzo span, .st-prezzo span"); return s ? s.textContent : ""; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function gioc(C, nome) { return (vm(C).giocatori || []).filter(function (g) { return g.nome === nome; })[0] || null; }
  function nomeDiId(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function fermo(w) { var st = w.document.createElement("style"); st.textContent = ".schermata,.as-mal-carta,.as-scen,.as-sorpresa,.as-buste .r{animation:none!important;opacity:1!important} .btn.as-auto::after{animation:none!important}"; w.document.head.appendChild(st); }

  // ---- la rete cattiva: W.__caos = { min, max, dup (0-1), disordine } ; null = come prima ----
  // le foto e tutto il resto arrivano in ordine (come il broker vero); le mosse rilancia/passa anche in disordine e doppie
  if (!W.__creaCK) {
    W.__creaCK = W.creaClient;
    W.creaClient = function (nome, opts) {
      var c = W.__creaCK(nome, opts), dl = c.deliver;
      c.deliver = function (topic, payload, ret) {
        // (per capire un NO: le ultime foto che ha ricevuto ogni telefono, W.__fotoDi[nome])
        if (/\/stato$/.test(topic)) try { var j = JSON.parse(String(payload)), v0 = j && (j.vm || (j.data && j.data.vm) || j); if (v0 && v0.fase) { var L0 = (W.__fotoDi = W.__fotoDi || {})[nome] = (W.__fotoDi[nome] || []).slice(-8); L0.push([Date.now() % 100000, v0.fase, v0.asta ? (v0.asta.nCarta != null ? v0.asta.nCarta : v0.asta.n) + ":" + v0.asta.offerta + ":" + (v0.asta.leaderNome || "-") : v0.esito ? "esito " + v0.esito.nCarta + " " + (v0.esito.tipo || "") : ""]); } } catch (e) {}
        var K = W.__caos; if (!K) return dl.apply(this, arguments);
        var self = this, s = String(payload), mossa = /\/azioni$/.test(topic) && /"t":"(rilancia|passa)"/.test(s);
        function una(ms) { setTimeout(function () { if (self.connected && !self.frozen) self.emit("message", topic, { toString: function () { return s; } }, { retain: ret }); }, ms); }
        function tempo() { return K.min + Math.random() * (K.max - K.min); }
        if (mossa && K.disordine) {
          una(tempo());
          if (Math.random() < K.dup) { K.doppi = (K.doppi || 0) + 1; una(tempo() + 30); }
          return;
        }
        var ora = Date.now(), quando = Math.max(ora + tempo(), (this.__ultimoK || 0) + 1); this.__ultimoK = quando;
        una(quando - ora);
        if (mossa && Math.random() < K.dup) { K.doppi = (K.doppi || 0) + 1; var q2 = quando + 20 + Math.random() * 200; this.__ultimoK = Math.max(this.__ultimoK, q2); una(q2 - ora); }
      };
      return c;
    };
  }
  // la rete calma in mezzo a una prova: messaggi subito ma SEMPRE in ordine dopo quelli ancora per strada (con W.__caos = null
  // la foto nuova arriverebbe prima di una vecchia ancora in ritardo, cosa che col broker vero non succede)
  function calma() { return { min: 5, max: 10, dup: 0, disordine: false }; }
  function spiaRete(nome) {   // i rilanci che manda un telefono (w.__mandati), per rimandarli uguali
    var h = W.reteDi(nome); if (!h) no("non trovo la rete di " + nome);
    if (h.__spiaK) return h;
    var inv = h.invia, w = W.finestra(nome); w.__mandati = [];
    h.invia = function (m) { if (m && m.t === "rilancia") w.__mandati.push(JSON.parse(JSON.stringify(m))); return inv.apply(this, arguments); };
    h.__spiaK = true; return h;
  }
  var X0 = 0;
  async function apriOspite(nome, C, opz) { var w = await W.apriTel(nome, Object.assign({ hash: "gioco=asta&stanza=" + C, x: 150 * (++X0) }, opz || {})); fermo(w); return w; }
  async function telefoni(imp, nomi) {
    X0 = 0;
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; w.__ricordaSpia = true; } }), C = await W.apriStanza(P, "L'Asta"); fermo(P);
    for (var i = 1; i < nomi.length; i++) await apriOspite(nomi[i], C);
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    nomi.slice(1).forEach(spiaRete);
    return { P: P, C: C, imp: imp };
  }
  function manda(nome, m) { var h = W.reteDi(nome); if (!h) no("non trovo la rete di " + nome); h.invia(m); }
  async function finoAllAsta(P, C, ms) {
    var fino = Date.now() + (ms || 25000);
    while (Date.now() < fino && vm(C).fase !== "asta") {
      var v = vm(C);
      if (v.fase === "scelta" && v.tavolo && v.tavolo.length) {
        if (v.sceglieId === "host") { var c = q(P, ".as-carta:not([disabled])"); if (c) c.click(); }
        else { var n0 = nomeDiId(C, v.sceglieId); if (n0) manda(n0, { t: "scegli", idx: 0, n: v.nScelta, nome: v.tavolo[0].nome }); }
      }
      W.clicca(P, /Vedi le carte|Avanti/);
      await W.dorme(400);
    }
    return vm(C).fase === "asta";
  }
  async function ferma(C, ms) {   // l'offerta nella foto non cambia più per 2,2 s
    var ultimo = "", da = Date.now(), fino = Date.now() + (ms || 8000);
    while (Date.now() < fino) {
      var a = vm(C).asta, k = a ? a.offerta + "|" + a.leaderId : vm(C).fase;
      if (k !== ultimo) { ultimo = k; da = Date.now(); }
      if (Date.now() - da > 2200) break;
      await W.dorme(100);
    }
    var x = vm(C).asta; return x ? { offerta: x.offerta, leader: x.leaderId, n: x.n != null ? x.n : x.nCarta } : null;
  }
  async function tocchi(w, sel, lista, gap) {
    for (var i = 0; i < lista.length; i++) {
      var b = bott(w, sel, lista[i]);
      if (!b) { var nm = Object.keys(W.BR ? W.BR.tel || {} : {}).filter(function (k) { return W.finestra(k) === w; })[0]; no("non trovo il tasto " + lista[i] + " (" + Date.now() % 100000 + ", foto di " + nm + ": " + JSON.stringify(((W.__fotoDi || {})[nm] || []).slice(-4)) + ", host: " + JSON.stringify(((W.__fotoDi || {}).Paky || []).slice(-3)) + " «" + T(w).slice(-140) + "»)"); }
      b.click();
      if (i < lista.length - 1) await W.dorme(gap || 50);
    }
  }
  function guardaFoto(C) {
    var G = { foto: [], stop: false };
    (async function () { while (!G.stop) { var v = vm(C); if (v.asta) G.foto.push({ off: v.asta.offerta, lead: v.asta.leaderId, n: v.asta.n != null ? v.asta.n : v.asta.nCarta, max: ((v.giocatori || []).filter(function (g) { return g.id === v.asta.leaderId; })[0] || {}).max }); await W.dorme(40); } })();
    return G;
  }
  function controllaFoto(G) {
    G.stop = true;
    var prima = null;
    G.foto.forEach(function (f) {
      if (f.max != null && f.off > f.max) no("l'offerta " + f.off + " supera il massimo di chi la tiene (" + f.max + ")");
      if (prima && prima.n === f.n && f.off < prima.off) no("l'offerta scende da " + prima.off + " a " + f.off);
      prima = f;
    });
  }
  // dopo che la foto si è fermata: tutti i telefoni mostrano la stessa offerta, «è tua» solo per il capo
  async function tuttiUguali(C, nomi, f, cosa) {
    var ok = await W.aspetta(function () { return nomi.every(function (n) { return prezzo(W.finestra(n)) === f.offerta; }); }, 5000);
    if (!ok) no(cosa + ": i tabelloni dicono " + nomi.map(function (n) { return n + " " + prezzo(W.finestra(n)); }).join(", ") + " invece di " + f.offerta);
    var capo = nomeDiId(C, f.leader);
    nomi.forEach(function (n) {
      var c = chi(W.finestra(n)), mio = /è tua/.test(c);
      if (n === capo && !mio) no(cosa + ": il capo " + n + " non legge «è tua» («" + c + "»)");
      if (n !== capo && mio) no(cosa + ": " + n + " legge «è tua» ma l'offerta è di " + capo);
    });
  }
  // due (o tre) telefoni toccano insieme: ognuno la sua lista di tasti, a 50 ms, sfalsati di 10 ms
  async function insieme(lista) {
    await Promise.all(lista.map(function (x, j) { return (async function () { await W.dorme(j * 10); await tocchi(W.finestra(x.nome), x.sel || ".sa-piede .btn", x.tasti); })(); }));
  }

  // ===================================================================== ck1
  COPIONE.aggiungi("ck1", { nome: "Asta temi in 5, rete cattiva (disordine + 40% doppi): a turno e insieme, sempre i conti giusti", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta", "Sara"];
    var o = await telefoni({ formato: "temi", crediti: 60, round: "normali", maledetta: false }, NOMI), P = o.P, C = o.C, x = [];
    try {
      if (!await finoAllAsta(P, C)) no("non parte l'asta");
      var a = vm(C).asta, carta = a.carta.nome, cr = {};
      NOMI.forEach(function (n) { cr[n] = gioc(C, n).crediti; });
      var ospiti = NOMI.slice(1).filter(function (n) { return idDi(n) !== a.leaderId; }), X = ospiti[0], Z = ospiti[1], Y = ospiti[2];
      var SEL = ".sa-piede .btn", SAL = ".as-salti .btn";
      if (!await W.aspetta(function () { return bott(W.finestra(X), SEL, /Rilancio/); }, 4000)) no(X + " non ha «Rilancio»");
      W.__caos = { min: 100, max: 900, dup: 0.4, disordine: true };
      var G = guardaFoto(C), p = vm(C).asta.offerta, f;
      async function passo(nome, tasti, piu, cosa) {
        var sel = tasti.map(function (t) { return /\\\+/.test(t.source) ? SAL : SEL; });
        for (var i = 0; i < tasti.length; i++) { var b = bott(W.finestra(nome), sel[i], tasti[i]); if (!b) no("non trovo " + tasti[i] + " per " + nome); b.click(); if (i < tasti.length - 1) await W.dorme(50); }
        f = await ferma(C);
        if (!f || f.offerta !== p + piu || f.leader !== idDi(nome)) no(cosa + ": l'host dice " + JSON.stringify(f && [f.offerta, nomeDiId(C, f.leader)]) + " invece di " + (p + piu) + " a " + nome);
        p = f.offerta; await tuttiUguali(C, NOMI, f, cosa); x.push(cosa + " →" + p);
      }
      await passo(X, [/Rilancio/, /Rialzo/], 2, "2 tocchi di " + X);
      await passo(Z, [/Rilancio/, /Rialzo/, /Rialzo/], 3, "3 tocchi di " + Z);
      await passo(Y, [/^\+3/, /Rialzo/], 4, "+3 e +1 di " + Y);
      await passo(X, [/^\+3/, /^\+3/], 6, "+3 e +3 di " + X);
      // --- due insieme, due tocchi ciascuno: sempre +2 esatti, il capo è uno dei due
      var coppie = [[Z, Y], [X, Z], [Y, X]];
      for (var k = 0; k < coppie.length; k++) {
        var c2 = coppie[k];
        await insieme([{ nome: c2[0], tasti: [/Rilancio|Rialzo/, /Rialzo/] }, { nome: c2[1], tasti: [/Rilancio|Rialzo/, /Rialzo/] }]);
        f = await ferma(C);
        var capo = nomeDiId(C, f.leader);
        if (f.offerta !== p + 2 || c2.indexOf(capo) < 0) no(c2.join(" e ") + " insieme (2 tocchi ciascuno): " + f.offerta + " a " + capo + " invece di " + (p + 2) + " a uno dei due");
        p = f.offerta; await tuttiUguali(C, NOMI, f, c2.join("+") + " insieme"); x.push(c2.join("+") + " insieme → " + capo + " " + p);
      }
      // --- due insieme coi salti: +3 e +1 (vale +4) contro +1 e +1 (vale +2): o l'uno o l'altro, mai altro
      var capoS = nomeDiId(C, f.leader), S1 = [X, Z, Y].filter(function (n) { return n !== capoS; })[0], S2 = [X, Z, Y].filter(function (n) { return n !== capoS && n !== S1; })[0];
      await Promise.all([
        (async function () { await tocchi(W.finestra(S1), SAL, [/^\+3/]); await W.dorme(50); await tocchi(W.finestra(S1), SEL, [/Rialzo/]); })(),
        (async function () { await W.dorme(10); await tocchi(W.finestra(S2), SEL, [/Rilancio/, /Rialzo/]); })()
      ]);
      f = await ferma(C);
      var capo2 = nomeDiId(C, f.leader);
      if (!((capo2 === S1 && f.offerta === p + 4) || (capo2 === S2 && f.offerta === p + 2))) no("salti insieme: " + f.offerta + " a " + capo2 + " (da " + p + "; doveva essere " + (p + 4) + " a " + S1 + " o " + (p + 2) + " a " + S2 + ")");
      p = f.offerta; await tuttiUguali(C, NOMI, f, "salti insieme"); x.push("salti insieme → " + capo2 + " " + p);
      // --- tre insieme, 3 tocchi ciascuno: +3 esatti
      var tre = [X, Z, Y];
      await insieme(tre.map(function (n) { return { nome: n, tasti: [/Rilancio|Rialzo/, /Rialzo/, /Rialzo/] }; }));
      f = await ferma(C);
      var capo3 = nomeDiId(C, f.leader);
      if (f.offerta !== p + 3 || tre.indexOf(capo3) < 0) no("tre insieme (3 tocchi ciascuno): " + f.offerta + " a " + capo3 + " invece di " + (p + 3));
      p = f.offerta; await tuttiUguali(C, NOMI, f, "tre insieme"); x.push("tre insieme → " + capo3 + " " + p);
      // --- tutti i rilanci già mandati, rimandati uguali (anche quelli vecchi): niente cambia
      tre.forEach(function (n) { var w = W.finestra(n); w.__mandati.slice(-4).forEach(function (m) { manda(n, m); manda(n, m); }); });
      await W.dorme(2500);
      var a2 = vm(C).asta;
      if (a2.offerta !== p || a2.leaderId !== f.leader) no("i doppioni rimandati hanno cambiato l'offerta: " + a2.offerta + " a " + a2.leaderNome);
      x.push("doppioni rimandati: niente (doppi della rete: " + (W.__caos.doppi || 0) + ")");
      if (!(W.__caos.doppi > 3)) no("la rete cattiva non ha fatto doppioni (" + W.__caos.doppi + ")");
      // --- tutti gli altri passano: la carta va al capo al prezzo giusto
      var capoF = nomeDiId(C, f.leader);
      NOMI.forEach(function (n) { if (n === capoF) return; if (n === "Paky") { var b = bott(P, SEL, /^Passo$/); if (b) b.click(); } else manda(n, { t: "passa", n: f.n }); });
      if (!await W.aspetta(function () { return vm(C).fase === "esito"; }, 8000)) no("l'asta non si chiude dopo i «Passo»");
      controllaFoto(G);
      var e = vm(C).esito;
      if (e.chiId !== f.leader || e.prezzo !== p || e.carta.nome !== carta) no("aggiudicata a " + e.chiNome + " per " + e.prezzo + " invece di " + capoF + " per " + p);
      NOMI.forEach(function (n) { var att = n === capoF ? cr[n] - p : cr[n]; if (gioc(C, n).crediti !== att) no(n + " ha " + gioc(C, n).crediti + " crediti invece di " + att); });
      x.push("aggiudicata a " + capoF + " per " + p + ", crediti giusti");
      senzaErrori();
    } finally { W.__caos = null; }
    return x.join(" · ");
  } });

  // ===================================================================== ck2
  COPIONE.aggiungi("ck2", { nome: "Asta temi in 4, pochi crediti, rete cattiva: al massimo e mai oltre", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta"];
    var o = await telefoni({ formato: "temi", crediti: 9, round: "normali", maledetta: false }, NOMI), P = o.P, C = o.C, x = [];
    try {
      if (!await finoAllAsta(P, C)) no("non parte l'asta");
      var a = vm(C).asta, ospiti = NOMI.slice(1).filter(function (n) { return idDi(n) !== a.leaderId; }), X = ospiti[0], Y = ospiti[1];
      var SEL = ".sa-piede .btn", SAL = ".as-salti .btn", m = gioc(C, X).max, crX = gioc(C, X).crediti, carta = a.carta.nome;
      if (m < 4) no("il massimo di " + X + " è troppo basso per la prova: " + m);
      W.__caos = { min: 100, max: 700, dup: 0.4, disordine: true };
      var G = guardaFoto(C);
      // Y porta l'offerta a m-2 (un tocco alla volta, aspettando la foto)
      while (vm(C).asta.offerta < m - 2) {
        await tocchi(W.finestra(Y), SEL, [/Rilancio|Rialzo/]);
        await W.aspetta(function () { return prezzo(W.finestra(X)) === vm(C).asta.offerta && vm(C).asta.leaderId === idDi(Y); }, 3000);
        await ferma(C, 4000);
      }
      if (vm(C).asta.offerta !== m - 2 || vm(C).asta.leaderId !== idDi(Y)) no("non arrivo a " + (m - 2) + " di " + Y + ": " + vm(C).asta.offerta);
      var wX = W.finestra(X);
      await W.aspetta(function () { return prezzo(wX) === m - 2; }, 4000);
      var b3 = bott(wX, SAL, /^\+3/); if (!b3 || !b3.disabled) no("a " + (m - 2) + " il +3 (" + (m + 1) + ") di " + X + " (massimo " + m + ") è acceso");
      // 4 tocchi fulminei: 2 contano, poi il tasto si spegne
      for (var k = 0; k < 4; k++) { var bb = bott(wX, SEL, /Rilancio|Rialzo/); if (bb && !bb.disabled) bb.click(); await W.dorme(50); }
      if (prezzo(wX) > m) no("il tabellone di " + X + " mostra " + prezzo(wX) + ", oltre il suo massimo " + m);
      // un messaggio finto oltre il massimo (partito proprio dall'offerta giusta) non conta
      manda(X, { t: "rilancia", n: a.n, prezzo: m + 1, vista: m, vl: String(idDi(X)), tk: Date.now() + 5 });
      if (!await W.aspetta(function () { return vm(C).fase === "esito"; }, 8000)) no("al massimo l'asta non si chiude (" + JSON.stringify(vm(C).asta && [vm(C).asta.offerta, vm(C).asta.leaderNome]) + ")");
      controllaFoto(G);
      var e = vm(C).esito;
      if (e.chiId !== idDi(X) || e.prezzo !== m || e.carta.nome !== carta) no("aggiudicata a " + e.chiNome + " per " + e.prezzo + " invece di " + X + " per " + m);
      if (gioc(C, X).crediti !== crX - m) no(X + " ha " + gioc(C, X).crediti + " crediti invece di " + (crX - m));
      if (gioc(C, Y).crediti !== 9) no(Y + " ha pagato senza vincere");
      x.push(X + " da " + (m - 2) + " con 4 tocchi → " + m + " (il suo massimo), crediti " + gioc(C, X).crediti);
      senzaErrori();
    } finally { W.__caos = null; }
    return x.join(" · ");
  } });

  // ===================================================================== ck3
  COPIONE.aggiungi("ck3", { nome: "Asta temi in 4: chi ricarica a metà dei tocchi (anche con l'orologio indietro): sempre +2", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta"];
    var o = await telefoni({ formato: "temi", crediti: 40, round: "normali", maledetta: false }, NOMI), P = o.P, C = o.C, x = [];
    try {
      if (!await finoAllAsta(P, C)) no("non parte l'asta");
      var a = vm(C).asta, X = NOMI.slice(1).filter(function (n) { return idDi(n) !== a.leaderId; })[0], idX = idDi(X), SEL = ".sa-piede .btn";
      W.__caos = { min: 200, max: 600, dup: 0.3, disordine: false };
      var p = vm(C).asta.offerta, f;
      async function riapri(opz) {
        var w = await W.ricarica(X, opz); fermo(w);
        if (!await W.aspetta(function () { return bott(w, SEL, /Rilancio|Rialzo/) && prezzo(w) === vm(C).asta.offerta; }, 10000)) no(X + " ricaricato non torna all'asta («" + T(w).slice(-140) + "»)");
        if (idDi(X) !== idX) no(X + " è rientrato con un altro id");
        spiaRete(X);
        return w;
      }
      // 1) due tocchi e subito ricarica: i due tocchi erano già partiti, contano tutti e due
      await tocchi(W.finestra(X), SEL, [/Rilancio/, /Rialzo/]);
      var w = await riapri();
      f = await ferma(C);
      if (f.offerta !== p + 2 || f.leader !== idX) no("2 tocchi e ricarica: " + JSON.stringify(f) + " invece di " + (p + 2));
      if (!/è tua/.test(chi(w))) no(X + " ricaricato non legge «è tua»");
      p = f.offerta; x.push("2 tocchi e ricarica → " + p);
      await tocchi(w, SEL, [/Rialzo/, /Rialzo/]);
      f = await ferma(C);
      if (f.offerta !== p + 2 || f.leader !== idX) no("dopo la ricarica 2 tocchi: " + f.offerta + " invece di " + (p + 2));
      p = f.offerta; x.push("dopo la ricarica +2 → " + p);
      // 2) un tocco, ricarica, un tocco
      await tocchi(w, SEL, [/Rialzo/]);
      w = await riapri();
      await tocchi(w, SEL, [/Rialzo/]);
      f = await ferma(C);
      if (f.offerta !== p + 2 || f.leader !== idX) no("un tocco, ricarica, un tocco: " + f.offerta + " invece di " + (p + 2));
      p = f.offerta; x.push("tocco + ricarica + tocco → " + p);
      // 3) l'orologio del telefono torna indietro di 2 minuti (si è rimesso a posto da solo) e ricarica
      w = await riapri({ orologio: -120000 });
      await tocchi(w, SEL, [/Rialzo/, /Rialzo/]);
      f = await ferma(C);
      if (f.offerta !== p + 2 || f.leader !== idX) no("con l'orologio indietro di 2 minuti, 2 tocchi: " + f.offerta + " invece di " + (p + 2));
      p = f.offerta; x.push("orologio indietro: +2 → " + p);
      // 4) un altro amico, poi lui di nuovo: 2 tocchi = +2
      var Y = NOMI.slice(1).filter(function (n) { return n !== X; })[0];
      await tocchi(W.finestra(Y), SEL, [/Rilancio/]); f = await ferma(C); p = f.offerta;
      await tocchi(w, SEL, [/Rilancio/, /Rialzo/]);
      f = await ferma(C);
      if (f.offerta !== p + 2 || f.leader !== idX) no("dopo " + Y + ", 2 tocchi di " + X + " (orologio indietro): " + f.offerta + " invece di " + (p + 2));
      x.push("dopo " + Y + " +2 → " + f.offerta);
      senzaErrori();
    } finally { W.__caos = null; }
    return x.join(" · ");
  } });

  // ===================================================================== ck4
  COPIONE.aggiungi("ck4", { nome: "Asta temi in 4: l'host ricarica coi tocchi per strada (ripresa finta): il lotto riparte, poi 2 tocchi = +2", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta"], IMP = { formato: "temi", crediti: 30, round: "normali", maledetta: false };
    var o = await telefoni(IMP, NOMI), P = o.P, C = o.C, x = [];
    try {
      if (!await finoAllAsta(P, C)) no("non parte l'asta");
      var a = vm(C).asta, X = NOMI.slice(1).filter(function (n) { return idDi(n) !== a.leaderId; })[0], SEL = ".sa-piede .btn", nA = a.n;
      W.__caos = { min: 300, max: 800, dup: 0.3, disordine: false };
      await tocchi(W.finestra(X), SEL, [/Rilancio/, /Rialzo/]);
      var vecchi = W.finestra(X).__mandati.slice();
      await W.dorme(30);
      var R = W.__ricordo; if (!R) no("t.ricorda non ha ricevuto niente");
      P = await W.ricarica("Paky", { pa: true, prima: function (w) { w.__imp = IMP; w.__ricordaSpia = true; w.__ripresa = R; } }); fermo(P);
      if (!await W.aspetta(function () { var v = vm(C); return v.fase === "asta" && v.asta && v.asta.n !== nA; }, 12000)) no("dopo la ricarica dell'host il lotto non riparte (fase " + vm(C).fase + ")");
      var a2 = vm(C).asta;
      if (a2.offerta !== 1) no("il lotto ripartito non parte da 1: " + a2.offerta);
      // i messaggi vecchi (asta di prima) rimandati: niente
      vecchi.forEach(function (m) { manda(X, m); });
      await W.dorme(1500);
      if (vm(C).asta.offerta !== 1) no("i tocchi dell'asta di prima contano nel lotto ripartito: " + vm(C).asta.offerta);
      var wX = W.finestra(X);
      if (!await W.aspetta(function () { return bott(wX, SEL, /Rilancio/) && prezzo(wX) === 1; }, 8000)) no(X + " non vede il lotto ripartito («" + T(wX).slice(-140) + "»)");
      await tocchi(wX, SEL, [/Rilancio/, /Rialzo/]);
      var f = await ferma(C);
      if (f.offerta !== 3 || f.leader !== idDi(X)) no("dopo la ricarica dell'host 2 tocchi: " + JSON.stringify(f) + " invece di 3 a " + X);
      x.push("ricarica host coi tocchi per strada: lotto da 1, vecchi niente, poi 2 tocchi → 3");
      senzaErrori();
    } finally { W.__caos = null; }
    return x.join(" · ");
  } });

  // ===================================================================== ck5
  COPIONE.aggiungi("ck5", { nome: "Asta temi in 3: due tocchi all'ultimo secondo del martello: +2 o niente, mai +1", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"];
    var o = await telefoni({ formato: "temi", crediti: 40, round: "normali", maledetta: false }, NOMI), P = o.P, C = o.C, x = [];
    var anticipi = [350, 200, 80];
    try {
      for (var giro = 0; giro < anticipi.length; giro++) {
        if (!await finoAllAsta(P, C, 30000)) no("non parte l'asta " + (giro + 1));
        var a = vm(C).asta, nA = a.n;
        var liberi = NOMI.filter(function (n) { return !gioc(C, n).haCarta; });
        var X = liberi.filter(function (n) { return n !== "Paky" && idDi(n) !== a.leaderId; })[0], Y = liberi.filter(function (n) { return n !== X; })[0];
        if (!X || !Y) { giro--; W.clicca(P, /Vedi le carte|Avanti/); await W.dorme(600); continue; }   // (qui toccherebbero solo l'host e il capo: si aspetta la prossima)
        var wX = W.finestra(X), cr = {}; NOMI.forEach(function (n) { cr[n] = gioc(C, n).crediti; });
        if (!await W.aspetta(function () { return bott(wX, ".sa-piede .btn", /Rilancio/); }, 4000)) no(X + " non ha «Rilancio»");
        // la scadenza esatta: Y tocca una volta e appena la foto nuova c'è (nel broker finto subito) si legge il tempo che resta
        var g0 = a.giro, scad = null;
        await tocchi(W.finestra(Y), ".sa-piede .btn", [/Rilancio|Rialzo/]);
        await W.aspetta(function () { var z = vm(C).asta; if (z && z.giro !== g0) { scad = Date.now() + z.resta; return true; } return false; }, 3000, 10);
        if (!scad) no("il tocco di " + Y + " non arriva");
        var capo = vm(C).asta.leaderId;
        W.__caos = { min: 150, max: 260, dup: 0.3, disordine: false };
        await W.dorme(Math.max(0, scad - Date.now() - anticipi[giro]));
        var p0 = vm(C).asta && vm(C).asta.n === nA ? vm(C).asta.offerta : null;
        if (p0 == null) { W.__caos = calma(); x.push("asta " + (giro + 1) + ": chiusa prima"); continue; }
        await tocchi(wX, ".sa-piede .btn", [/Rilancio/, /Rialzo/]);
        await W.dorme(1500);
        var v = vm(C), esito;
        if (v.fase === "asta" && v.asta && v.asta.n === nA) {
          var f = await ferma(C, 4000);
          if (f.offerta !== p0 + 2 || f.leader !== idDi(X)) no("ultimo secondo (" + anticipi[giro] + " ms): l'asta continua a " + f.offerta + " a " + nomeDiId(C, f.leader) + " invece di " + (p0 + 2) + " a " + X);
          esito = "+2 (martello ripartito)";
          // gli altri passano
          NOMI.forEach(function (n) { if (n === X || gioc(C, n).haCarta) return; if (n === "Paky") { var b = bott(P, ".sa-piede .btn", /^Passo$/); if (b) b.click(); } else manda(n, { t: "passa", n: nA }); });
          if (!await W.aspetta(function () { return vm(C).fase !== "asta" || vm(C).asta.n !== nA; }, 12000)) no("l'asta non si chiude");
          var e1 = vm(C).esito; if (e1 && (e1.chiId !== idDi(X) || e1.prezzo !== p0 + 2)) no("aggiudicata a " + e1.chiNome + " per " + e1.prezzo + " invece di " + X + " per " + (p0 + 2));
        } else {
          var e = v.esito;
          if (!e || e.chiId !== capo || e.prezzo !== p0) no("ultimo secondo (" + anticipi[giro] + " ms): l'esito è " + JSON.stringify(e && [e.chiNome, e.prezzo]) + " invece di " + nomeDiId(C, capo) + " a " + p0 + " (mai +1)");
          if (gioc(C, X).crediti !== cr[X]) no(X + " ha pagato senza vincere");
          esito = "troppo tardi: al capo di prima a " + p0;
          await W.dorme(4200);   // (oltre i 4 secondi dei tocchi per strada)
          var vv = vm(C);
          if (!(vv.fase === "asta" && vv.asta && vv.asta.n !== nA) && bott(wX, ".sa-piede .btn", /Rilancio|Rialzo/)) no(X + " dopo il martello rivede la sala di prima coi tasti (fase " + vv.fase + ")");
        }
        W.__caos = calma();
        x.push(anticipi[giro] + " ms prima: " + esito);
        W.clicca(P, /Vedi le carte|Avanti/);
      }
      senzaErrori();
    } finally { W.__caos = null; }
    return x.join(" · ");
  } });

  // ===================================================================== ck6
  COPIONE.aggiungi("ck6", { nome: "Asta fantacalcio in 4, rete cattiva: insieme = 2, +2 e +5 = +7, ruolo pieno senza tasti, crediti e rose giuste", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta"];
    var o = await telefoni({ formato: "fanta" }, NOMI), P = o.P, C = o.C, x = [], SEL = ".st-piede .btn", SAL = ".as-salti .btn";
    try {
      var pieno = 0, fatti = 0, fino = Date.now() + 150000, ultimaN = null;
      while (Date.now() < fino && fatti < 5 && vm(C).fase !== "fine") {
        if (!await W.aspetta(function () { var v = vm(C); return v.fase === "asta" && v.asta && !v.asta.leaderId && v.asta.nCarta !== ultimaN; }, 20000)) no("non arrivo al calciatore dopo (" + vm(C).fase + ")");
        var v = vm(C), a = v.asta, nC = a.nCarta, ruolo = a.ruolo; ultimaN = nC;
        var cr = {}, conta = {}; NOMI.forEach(function (n) { var g = gioc(C, n); cr[n] = g.crediti; conta[n] = (g.conta || {})[ruolo] || 0; });
        var liberi = NOMI.slice(1).filter(function (n) { return (gioc(C, n).conta[ruolo] || 0) < ({ P: 1, D: 1, C: 2, A: 1 })[ruolo] && gioc(C, n).max >= 9; });
        var pieni = NOMI.slice(1).filter(function (n) { return (gioc(C, n).conta[ruolo] || 0) >= ({ P: 1, D: 1, C: 2, A: 1 })[ruolo]; });
        W.__caos = { min: 100, max: 800, dup: 0.4, disordine: true };
        var G = guardaFoto(C);
        // chi ha il ruolo pieno: niente tasti, e un suo messaggio non conta
        for (var i = 0; i < pieni.length; i++) {
          var wp = W.finestra(pieni[i]);
          await W.aspetta(function () { return prezzo(wp) != null; }, 3000);
          if (bott(wp, SEL, /Lo prendo|Rilancio|Rialzo/)) no(pieni[i] + " ha il ruolo " + ruolo + " pieno ma ha i tasti per offrire");
          manda(pieni[i], { t: "rilancia", n: nC, prezzo: 1, vista: 1, vl: "", tk: Date.now() });
          pieno++;
        }
        if (liberi.length < 2) {   // nessuna gara: lo prende chi può, poi si va avanti
          var solo = liberi[0];
          if (solo) {   // (con la rete lenta la foto del calciatore nuovo può arrivargli dopo: si aspetta il tasto)
            if (!await W.aspetta(function () { return bott(W.finestra(solo), SEL, /Lo prendo/); }, 4000)) no(solo + " non ha «Lo prendo»");
            await tocchi(W.finestra(solo), SEL, [/Lo prendo/]);
          }
          await W.aspetta(function () { return vm(C).fase !== "asta" || vm(C).asta.nCarta !== nC; }, 15000);
          controllaFoto(G); W.__caos = calma(); fatti++; continue;
        }
        var X = liberi[0], Z = liberi[1];
        if (!await W.aspetta(function () { return bott(W.finestra(X), SEL, /Lo prendo/) && bott(W.finestra(Z), SEL, /Lo prendo/); }, 4000)) no("niente «Lo prendo» per " + X + " e " + Z);
        await insieme([{ nome: X, sel: SEL, tasti: [/Lo prendo/, /Rialzo/] }, { nome: Z, sel: SEL, tasti: [/Lo prendo/, /Rialzo/] }]);
        var f = await ferma(C), capo = nomeDiId(C, f.leader);
        if (f.offerta !== 2 || [X, Z].indexOf(capo) < 0) no(ruolo + ": " + X + " e " + Z + " insieme «Lo prendo» + «Rialzo»: " + f.offerta + " a " + capo + " invece di 2");
        await tuttiUguali(C, NOMI, f, ruolo + " insieme");
        // il capo: +2 e +5 = +7
        await tocchi(W.finestra(capo), SAL, [/^\+2/]); await W.dorme(50); await tocchi(W.finestra(capo), SAL, [/^\+5/]);
        f = await ferma(C);
        if (f.offerta !== 9 || nomeDiId(C, f.leader) !== capo) no(ruolo + ": +2 e +5 di " + capo + ": " + f.offerta + " invece di 9");
        // i rilanci di prima rimandati: niente
        [X, Z].forEach(function (n) { W.finestra(n).__mandati.slice(-3).forEach(function (m) { manda(n, m); }); });
        await W.dorme(1800);
        if (vm(C).asta && vm(C).asta.nCarta === nC && vm(C).asta.offerta !== 9) no("i doppioni hanno cambiato l'offerta: " + vm(C).asta.offerta);
        // gli altri passano: a lui per 9
        NOMI.forEach(function (n) { if (n === capo) return; if (n === "Paky") { var b = bott(P, SEL, /^Passo$/); if (b) b.click(); } else manda(n, { t: "passa", n: nC }); });
        if (!await W.aspetta(function () { return vm(C).fase === "esito" || (vm(C).asta && vm(C).asta.nCarta !== nC); }, 12000)) no("il calciatore non si aggiudica");
        controllaFoto(G);
        await W.aspetta(function () { return gioc(C, capo).crediti !== cr[capo]; }, 3000);
        NOMI.forEach(function (n) {
          var g = gioc(C, n), att = n === capo ? cr[n] - 9 : cr[n], ca = n === capo ? conta[n] + 1 : conta[n];
          if (g.crediti !== att) no(n + " ha " + g.crediti + " crediti invece di " + att);
          if ((g.conta[ruolo] || 0) !== ca) no(n + " ha " + (g.conta[ruolo] || 0) + " del ruolo " + ruolo + " invece di " + ca);
        });
        x.push(ruolo + ": " + X + "+" + Z + " insieme → " + capo + " 2, +2 +5 → 9, comprato");
        W.__caos = calma(); fatti++;
      }
      if (!pieno) x.push("(nessun ruolo pieno capitato)"); else x.push("ruolo pieno senza tasti: " + pieno + " volte");
      senzaErrori();
    } finally { W.__caos = null; }
    return x.join(" · ");
  } });

  // ===================================================================== ck7
  // I tocchi arrivati AL CONTRARIO, apposta (gli stessi messaggi che manda il telefono, con lo stesso numero di tocco):
  // chi ha già l'offerta più alta rialza 2 volte e il secondo arriva prima del primo (+2); 3 tocchi tutti al contrario, di
  // chi guida e di chi non guida (+3); nel fantacalcio «Lo prendo» + «Rialzo» + «+5» al contrario (= 7). Ogni messaggio
  // arriva anche doppio. Prima della correzione del 17 ott il secondo tocco di chi guida arrivato prima si perdeva insieme al primo.
  COPIONE.aggiungi("ck7", { nome: "Asta online: tocchi arrivati al contrario (e doppi): chi guida +2, tre al contrario +3, fanta = 7", fai: async function () {
    var x = [];
    async function catena(C, nome, n, passi) {   // passi: [salto, ...] dall'offerta di adesso; li manda dal più nuovo al più vecchio, ognuno due volte
      var a = vm(C).asta, off = a.offerta, lead = a.leaderId, senza = !lead, tk0 = Date.now(), msg = [];
      passi.forEach(function (s, i) {
        var base = senza && i === 0 ? off - 1 : off, pr = base + s;
        msg.push({ t: "rilancia", n: n, prezzo: pr, vista: off, vl: String(lead || ""), tk: tk0 + i + 1 });
        off = pr; lead = idDi(nome); senza = false;
      });
      msg.slice().reverse().forEach(function (m) { manda(nome, m); manda(nome, m); });
      return off;
    }
    // --- temi
    var o = await telefoni({ formato: "temi", crediti: 40, round: "normali", maledetta: false }, ["Paky", "Giulia", "Luca"]), P = o.P, C = o.C;
    if (!await finoAllAsta(P, C)) no("non parte l'asta");
    var a = vm(C).asta, X = nomeDiId(C, a.leaderId) === "Giulia" ? "Luca" : "Giulia", Y = X === "Giulia" ? "Luca" : "Giulia";
    var att = await catena(C, X, a.n, [1, 1]);   // chi non guida: prende e rialza (al contrario)
    var f = await ferma(C, 5000);
    if (f.offerta !== att || f.leader !== idDi(X)) no("temi, " + X + " non guida, 2 tocchi al contrario: " + JSON.stringify(f) + " invece di " + att);
    x.push("non guida, 2 al contrario → " + f.offerta);
    att = await catena(C, X, a.n, [1, 1]);   // chi guida: 2 rialzi al contrario
    f = await ferma(C, 5000);
    if (f.offerta !== att || f.leader !== idDi(X)) no("temi, " + X + " guida, 2 rialzi al contrario: " + f.offerta + " invece di " + att);
    x.push("guida, 2 al contrario → " + f.offerta);
    att = await catena(C, X, a.n, [3, 1, 1]);   // chi guida: +3 +1 +1 al contrario
    f = await ferma(C, 5000);
    if (f.offerta !== att || f.leader !== idDi(X)) no("temi, " + X + " guida, +3 +1 +1 al contrario: " + f.offerta + " invece di " + att);
    x.push("guida, +3 +1 +1 al contrario → " + f.offerta);
    att = await catena(C, Y, a.n, [1, 1, 1]);   // l'altro: 3 al contrario
    f = await ferma(C, 5000);
    if (f.offerta !== att || f.leader !== idDi(Y)) no("temi, " + Y + " non guida, 3 al contrario: " + f.offerta + " invece di " + att);
    x.push(Y + " 3 al contrario → " + f.offerta);
    // e il tabellone di tutti dice lo stesso
    await tuttiUguali(C, ["Paky", "Giulia", "Luca"], f, "dopo i tocchi al contrario");
    // --- fanta
    A.pulisci();
    o = await telefoni({ formato: "fanta" }, ["Paky", "Giulia", "Luca"]); P = o.P; C = o.C;
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "asta" && v.asta && !v.asta.leaderId; }, 15000)) no("non arrivo al primo calciatore");
    var nC = vm(C).asta.nCarta;
    att = await catena(C, "Giulia", nC, [1, 1, 5]);   // «Lo prendo» (1) + «Rialzo» (2) + «+5» (7), al contrario
    f = await ferma(C, 5000);
    if (f.offerta !== 7 || att !== 7 || f.leader !== idDi("Giulia")) no("fanta, «Lo prendo» + «Rialzo» + «+5» al contrario: " + JSON.stringify(f) + " invece di 7");
    att = await catena(C, "Giulia", nC, [2, 1]);   // chi guida: +2 e +1 al contrario
    f = await ferma(C, 5000);
    if (f.offerta !== 10 || f.leader !== idDi("Giulia")) no("fanta, chi guida +2 +1 al contrario: " + f.offerta + " invece di 10");
    x.push("fanta: lo prendo + rialzo + 5 al contrario = 7, poi +2 +1 = 10");
    senzaErrori();
    return x.join(" · ");
  } });
})();
