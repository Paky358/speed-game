// PROVE del Poker, giro 2 (g5): «📊 Le percentuali da TV» all'all-in (Texas Hold'em) e «💣 Mano bomba» (solo nel Torneo della serata).
// Uso (da una pagina del sito, dopo copione-prova.js):
//   await COPIONE.carica("migliora2/g5-poker.js"); window.__run = COPIONE.prova("g5a")   (poi "g5b", "g5c", "g5d")
// Gli scenari col tavolo durano 1-4 minuti: lanciali senza aspettarli e poi leggi COPIONE.esiti (o await window.__run).
//
// g5a: il motore da solo. forza7 (il conto veloce) dà SEMPRE lo stesso vincitore di miglioreMano (48.000 coppie di mani, anche
//      con mazzi "truccati" per avere tanti full, colori, poker e scale colore); le percentuali al flop e al turn sono UGUALI a un
//      conto fatto a mano con miglioreMano; AA contro KK prima del flop ≈ 82%; i tempi per strada (da 2 a 10 giocatori) sotto
//      i 150 ms; la Mano bomba nel motore (Hold'em: flop subito, si punta dal flop, chi è corto va all-in, fiches che tornano;
//      all'italiana: subito il cambio); percentuali spente = mai nella foto; chi esce durante la corsa sparisce dalle percentuali.
// g5b: contro i Bot (Texas Hold'em, 4 Bot facili): all-in finché il Bot chiama. Le percentuali compaiono accanto al Bot e la mia
//      («Tu 62%») in basso, cambiano a ogni strada SENZA rifare i nodi (stesso cartellino, stesso posto), a carte finite chi
//      vince si illumina; misure 360x640 e 412x915 coi cartellini; poi con «📊 No» nessun cartellino.
// g5c: online (stanza) in 3 col Torneo della serata e «💣 1 ogni 5»: il ⚙️ (Mano bomba solo col torneo, percentuali solo nel
//      Texas Hold'em), la riga «📜 Si gioca così» degli amici; Sara arriva a torneo iniziato e guarda; 4 mani tranquille, la 5ª
//      è la Mano bomba: tutti 💣 40, flop già scoperto, si punta dal flop, 💣 sul piatto, l'annuncio grande con una vibrazione
//      su Giulia; Luca ricarica a mano bomba cominciata: niente annuncio di nuovo, ma il 💣 sul piatto sì; poi tutti all-in:
//      le percentuali le vedono anche Giulia e Sara (che guarda). Per tutta la prova: nella foto MAI carte coperte, le
//      percentuali solo di chi ha le carte girate. Fino alla fine del torneo; mai Speed Coins salvate.
// g5d: contro i Bot all'italiana, torneo con «💣 1 ogni 5»: la 5ª mano è la bomba (si va subito al cambio, «💣 Mano bomba ·
//      🔄 Cambio delle carte…», nessuna puntata prima), mai percentuali nel Poker all'italiana; misure col cartello della bomba.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm;

  // ---- la spia del Poker (apriTel(nome, { g5: true })): w.__t = il tavolo, w.__imp = regole per la prova, w.__ris = i t.risultato ----
  if (!W.__prepG5) {
    W.__prepG5 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG5(w, nome, opz);
      if (!opz || !opz.g5) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "poker") {
            var av = g.avvia;
            g.avvia = function (t) {
              w.__t = t;
              if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              var ris = t.risultato;
              t.risultato = function (c) { w.__ris = (w.__ris || []).concat([JSON.parse(JSON.stringify(c))]); return ris ? ris.apply(this, arguments) : undefined; };
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  function spiaMonete(w, monete) {
    w.__salvaF = w.__salvaF || 0; w.__vibra = w.__vibra || [];
    try { w.navigator.vibrate = function (x) { w.__vibra.push(x); return true; }; } catch (e) {}
    if (!w.SGNube) return;
    if (monete != null) w.SGNube.fiches = function () { return monete; };
    w.SGNube.salvaFiches = function () { w.__salvaF++; };
  }
  async function tel(nome, o) {
    o = o || {};
    return W.apriTel(nome, Object.assign({ g5: true, prima: function (x) { spiaMonete(x, o.monete); } }, o));
  }
  function senzaErrori(cosa) { var e = W.erroriTel(); if (e.length) no((cosa ? cosa + ": " : "") + "errori: " + e.slice(0, 3).join(" | ")); }
  function visibili(w, sel) { return [].filter.call(w.document.querySelectorAll(sel), function (x) { return x.offsetParent !== null && x.style.display !== "none"; }); }
  async function misura(w, nome, larg, alt, sel) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(500);
    var e = "";
    if (d.documentElement.scrollHeight > alt + 1) e = "la pagina scorre (" + d.documentElement.scrollHeight + ")";
    else if (d.documentElement.scrollWidth > larg + 1) e = "la pagina scorre di lato (" + d.documentElement.scrollWidth + ")";
    else if (sel) [].forEach.call(d.querySelectorAll(sel), function (x) {
      var r = x.getBoundingClientRect(); if (!e && r.width && (r.bottom > alt + 1 || r.right > larg + 1 || r.left < -1 || r.top < -1)) e = "«" + x.textContent.trim().slice(0, 30) + "» esce dallo schermo";
    });
    return e ? nome + " a " + larg + "x" + alt + ": " + e : "";
  }
  async function misure(w, nome, sel) {
    var M = [[360, 640], [412, 915]], err = [];
    for (var k = 0; k < M.length; k++) { var e = await misura(w, nome, M[k][0], M[k][1], sel); if (e) err.push(e); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    if (err.length) no(err.join(" · "));
    return "misure ok";
  }
  async function avviaLocale(P, nomeGioco, nomeModo) {
    P.__t = null;
    var tess = await W.aspetta(function () { return A.tessera(P, nomeGioco); }, 6000);
    if (!tess) no("non trovo la tessera " + nomeGioco);
    tess.click(); await W.dorme(500);
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return b.textContent.indexOf(nomeModo) >= 0; }); }, 4000);
    if (!bm) no("in «Come giocate?» non c'è «" + nomeModo + "»");
    bm.click(); await W.dorme(400);
    for (var k = 0; k < 8 && !P.__t; k++) {
      await W.dorme(300);
      var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|▶/.test(x.textContent) && !x.disabled; });
      if (b) b.click();
    }
    if (!await W.aspetta(function () { return P.__t; }, 3000)) no(nomeGioco + " non parte («" + T(P).slice(0, 70) + "»)");
  }
  // ---- le mosse ----
  function pkIo(v, id) { return (v.players || []).filter(function (p) { return p.id === id; })[0] || null; }
  function somma(v) { return (v.players || []).reduce(function (s, p) { return s + p.stack; }, 0) + (v.piatto || 0); }
  async function pkHost(P, tipo) {
    var d = P.document;
    if (tipo === "lascia") { var l = d.querySelector(".pk-azioni .pk-btn.lascia"); if (l) l.click(); return !!l; }
    if (tipo === "passa") { var p = d.querySelector(".pk-azioni .pk-btn.passa"); if (p) p.click(); return !!p; }
    var b = d.querySelector(".pk-azioni .pk-btn.punta");
    if (!b) { var c = d.querySelector(".pk-azioni .pk-btn.passa"); if (c) c.click(); return !!c; }
    if (/^All-in/.test(b.textContent)) { b.click(); return true; }
    b.click(); await W.dorme(700);
    W.clicca(P, /^All-in$/, ".pk-azioni .pk-btn.piccolo"); await W.dorme(100);
    var ok = d.querySelector(".pk-azioni .pk-btn.ok"); if (ok) ok.click();
    return !!ok;
  }
  function pkOsp(nome, v, tipo, tot) { var h = W.reteDi(nome); if (h) h.invia({ t: "azione", tipo: tipo, tot: tot || 0, n: v.n, st: v.stato, dc: v.daChiamare }); }
  function pkMosse(v, id) {
    var io = pkIo(v, id); if (!io) return null;
    var serve = Math.max(0, v.daChiamare - io.inGiro), tutto = io.inGiro + io.stack;
    return { passa: serve === 0, chiama: serve > 0, max: tutto, punta: tutto > v.daChiamare && !io.chiuso };
  }
  async function pkMano(C, nomi, strat, ms) {
    var fino = Date.now() + (ms || 30000), n0 = vm(C).n, fatto = {};
    while (Date.now() < fino) {
      var v = vm(C);
      if (v.fase !== "gioco" || v.stato === "finemano" || v.n !== n0) return v;
      var k = v.n + "|" + v.stato + "|" + v.turno + "|" + v.daChiamare;
      if (v.turno && !fatto[k]) {
        var s = strat(v, v.turno), m = pkMosse(v, v.turno);
        fatto[k] = 1;
        if (v.turno === "host") await pkHost(W.finestra("Paky"), s);
        else if (nomi[v.turno] && m) {
          if (s === "allin") { if (m.punta) pkOsp(nomi[v.turno], v, "punta", m.max); else pkOsp(nomi[v.turno], v, m.passa ? "passa" : "chiama"); }
          else if (s === "passa") pkOsp(nomi[v.turno], v, m.passa ? "passa" : "chiama");
          else pkOsp(nomi[v.turno], v, "lascia");
        } else delete fatto[k];
      }
      await W.dorme(200);
    }
    return vm(C);
  }
  function nomiId(lista) { var o = {}; lista.forEach(function (n) { var id = A.mioId(n); if (id) o[id] = n; }); return o; }
  // la guardia della foto: carte girate solo quando si deve, percentuali solo di chi ha le carte girate
  function guardia(C) {
    var G = { errori: [], visti: 0, conPerc: 0, stop: false };
    (function giro() {
      if (G.stop) return;
      var v = vm(C);
      if (v && v.players && v.fase === "gioco") {
        G.visti++;
        var scop = {}; v.players.forEach(function (p) { if (p.carte) scop[p.id] = 1; });
        if (Object.keys(scop).length && !(v.corsa || v.stato === "finemano")) G.errori.push("carte girate fuori dall'all-in/fine mano (mano " + v.n + ", " + v.stato + ")");
        if (v.perc) {
          G.conPerc++;
          if (v.variante !== "he") G.errori.push("percentuali nel Poker all'italiana");
          if (!(v.corsa || v.stato === "finemano")) G.errori.push("percentuali senza all-in (mano " + v.n + ", " + v.stato + ")");
          Object.keys(v.perc).forEach(function (id) { if (!scop[id]) G.errori.push("percentuale di chi ha le carte coperte (" + id + ", mano " + v.n + ")"); });
        }
        ["mano", "mazzo", "mie"].forEach(function (k) { if (JSON.stringify(v).indexOf("\"" + k + "\":[{") >= 0) G.errori.push("nella foto c'è «" + k + "» con delle carte"); });
      }
      setTimeout(giro, 120);
    })();
    return G;
  }

  // =================== g5a: il motore ===================
  COPIONE.aggiungi("g5a", { nome: "Poker, motore: forza7 = miglioreMano, percentuali esatte e veloci, Mano bomba nel motore", fai: async function () {
    var P = await tel("Paky", { x: 0 }), PK = P.__POKER, note = [];
    if (!PK || !PK.forza7 || !PK.percentuali) no("__POKER non ha forza7 e percentuali");
    function mazzoDa(semi, ranghi) { var m = []; semi.forEach(function (s) { ranghi.forEach(function (v) { m.push({ v: v, s: s }); }); }); for (var i = m.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = m[i]; m[i] = m[j]; m[j] = x; } return m; }
    var tutti = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    var casi = [[[0, 1, 2, 3], tutti], [[0, 1, 2, 3], [1, 2, 3, 4, 5, 6]], [[0, 1, 2, 3], [1, 10, 11, 12, 13]], [[0, 1], tutti], [[0, 1, 2, 3], [2, 3, 4, 5]], [[0, 1, 2, 3], [1, 2, 3, 4, 5, 9, 13]]];
    var err = 0, n = 0, tipi = {};
    casi.forEach(function (cs) { for (var k = 0; k < 8000; k++) {
      var m = mazzoDa(cs[0], cs[1]), a = m.slice(0, 7), b = m.slice(7, 9).concat(m.slice(2, 7));
      var ma = PK.miglioreMano(a, "he", 2), mb = PK.miglioreMano(b, "he", 2); tipi[ma.tipo] = 1;
      if (Math.sign(PK.confronta(ma.v, mb.v)) !== Math.sign(PK.forza7(a) - PK.forza7(b))) { err++; if (err < 3) note.push("diverso: " + JSON.stringify(a) + " / " + JSON.stringify(b)); }
      n++;
    } });
    if (err) no("forza7 e miglioreMano non danno lo stesso vincitore in " + err + " casi su " + n + " · " + note.join(" "));
    if (Object.keys(tipi).length < 9) no("le prove non hanno toccato tutte le combinazioni (" + Object.keys(tipi).join(",") + ")");
    note.push(n + " coppie uguali (tutte e 9 le combinazioni)");
    // il conto a mano (lento) con miglioreMano, per il flop e il turn
    function aMano(mani, tav) {
      var usate = {}; mani.concat([tav]).forEach(function (cc) { cc.forEach(function (c) { usate[c.v + "-" + c.s] = 1; }); });
      var resto = []; for (var s = 0; s < 4; s++) for (var v = 1; v <= 13; v++) if (!usate[v + "-" + s]) resto.push({ v: v, s: s });
      var vin = mani.map(function () { return 0; }), par = vin.slice(), tot = 0;
      function conta(ex) {
        var vv = mani.map(function (m) { return PK.miglioreMano(m.concat(tav).concat(ex), "he", 2).v; }), best = vv[0];
        vv.forEach(function (x) { if (PK.confronta(x, best) > 0) best = x; });
        var chi = vv.map(function (x) { return PK.confronta(x, best) === 0; }), q = chi.filter(Boolean).length;
        chi.forEach(function (c, k) { if (c) { if (q === 1) vin[k]++; else par[k]++; } }); tot++;
      }
      if (tav.length === 4) resto.forEach(function (c) { conta([c]); });
      else for (var i = 0; i < resto.length; i++) for (var j = i + 1; j < resto.length; j++) conta([resto[i], resto[j]]);
      return mani.map(function (m, k) { return [Math.round(vin[k] / tot * 1000) / 10, Math.round(par[k] / tot * 1000) / 10]; });
    }
    for (var prova = 0; prova < 6; prova++) {
      var m = mazzoDa([0, 1, 2, 3], prova % 2 ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : tutti), nG = 2 + (prova % 3);
      var mani = []; for (var g = 0; g < nG; g++) mani.push(m.slice(g * 2, g * 2 + 2));
      var tav = m.slice(nG * 2, nG * 2 + (prova < 3 ? 4 : 3));
      var veloce = JSON.stringify(PK.percentuali(mani, tav)), lento = JSON.stringify(aMano(mani, tav));
      if (veloce !== lento) no("percentuali diverse dal conto a mano (" + tav.length + " carte in mezzo): " + veloce + " invece di " + lento);
    }
    note.push("flop e turn uguali al conto a mano");
    var AA = [{ v: 1, s: 0 }, { v: 1, s: 1 }], KK = [{ v: 13, s: 2 }, { v: 13, s: 3 }], pre = PK.percentuali([AA, KK], [], 3000);
    if (Math.abs(pre[0][0] - 81.9) > 3.5) no("AA contro KK prima del flop: " + pre[0][0] + "% invece di circa 82%");
    note.push("AA-KK " + pre[0][0] + "%");
    // i tempi per strada (sul telefono lento del proprietario conta il caso peggiore: 10 giocatori)
    var peggio = 0, dove = "";
    [2, 3, 6, 10].forEach(function (nn) {
      var mm = mazzoDa([0, 1, 2, 3], tutti), mani2 = []; for (var g2 = 0; g2 < nn; g2++) mani2.push(mm.slice(g2 * 2, g2 * 2 + 2));
      [0, 3, 4, 5].forEach(function (k) {
        // (come nel gioco: prima del flop min(3.000, 12.000 / giocatori) tavoli a caso; si guarda la mediana di 3 conti, non i colpi di tosse del browser)
        var tt = []; for (var r3 = 0; r3 < 3; r3++) { var t0 = performance.now(); PK.percentuali(mani2, mm.slice(nn * 2, nn * 2 + k), Math.min(3000, Math.round(12000 / nn))); tt.push(performance.now() - t0); }
        var dt = tt.sort(function (x, y) { return x - y; })[1];
        if (dt > peggio) { peggio = dt; dove = nn + " giocatori, " + k + " carte in mezzo"; }
      });
    });
    if (peggio > 150) no("il conto è lento: " + Math.round(peggio) + " ms (" + dove + ")");
    note.push("tempo peggiore " + Math.round(peggio) + " ms (" + dove + ")");
    // la Mano bomba nel motore
    var M = PK.creaMotore("he"); M.conPerc = true;
    M.siedi({ id: "a", nome: "A", stack: 1000 }); M.siedi({ id: "b", nome: "B", stack: 1000 }); M.siedi({ id: "c", nome: "C", stack: 25 });
    M.nuovaMano({ bomba: 40 });
    if (M.stato !== "flop" || M.tavolo.length !== 3 || M.piatto !== 105 || M.daChiamare !== 0 || M.bomba !== 40) no("bomba Hold'em: " + M.stato + " " + M.tavolo.length + " carte, piatto " + M.piatto);
    if (M.giocatori.map(function (p) { return p.stack + (p.allin ? "!" : ""); }).join() !== "960,960,0!") no("bomba: fiches dopo la puntata " + M.giocatori.map(function (p) { return p.stack; }).join());
    if (!/^💣 40$/.test(M.giocatori[0].azione) || !/^💣 25$/.test(M.giocatori[2].azione)) no("bomba: le scritte sono " + M.giocatori.map(function (p) { return p.azione; }).join(" / "));
    if (M.turno < 0 || M.giocatori[M.turno].allin) no("bomba: non tocca a nessuno puntare dal flop");
    var g3 = 0; while (M.stato !== "finemano" && g3++ < 40) M.azione(M.turno, "passa");
    if (M.stato !== "finemano" || M.tavolo.length !== 5 || M.giocatori.reduce(function (s, p) { return s + p.stack; }, 0) !== 2025) no("bomba: la mano non finisce giusta");
    M = PK.creaMotore("he"); M.conPerc = true;
    M.siedi({ id: "a", nome: "A", stack: 30 }); M.siedi({ id: "b", nome: "B", stack: 1000 }); M.nuovaMano({ bomba: 40 });
    if (!M.corsa || !M.perc || M.perc.a == null) no("bomba con uno corto: niente corsa con le percentuali (" + M.stato + ")");
    var strade = [M.tavolo.length]; while (M.corsa) { M.corsaPasso(); strade.push(M.tavolo.length + ":" + (M.perc ? Math.round(M.perc.a[0] + M.perc.b[0] + M.perc.a[1]) : "-")); }
    if (M.giocatori.map(function (p) { return p.stack; }).reduce(function (a, b) { return a + b; }) !== 1030) no("bomba con uno corto: le fiches non tornano");
    note.push("corsa della bomba " + strade.join(" → "));
    var MI = PK.creaMotore("it");
    MI.siedi({ id: "a", nome: "A", stack: 1000 }); MI.siedi({ id: "b", nome: "B", stack: 1000 }); MI.siedi({ id: "c", nome: "C", stack: 1000 });
    MI.nuovaMano({ bomba: 80 });
    if (MI.stato !== "cambio" || MI.piatto !== 240 || MI.turno !== -1) no("bomba all'italiana: " + MI.stato + ", piatto " + MI.piatto);
    MI.cambia(0, [0]); MI.cambia(1, []); MI.cambia(2, [1, 2]);
    if (MI.stato !== "puntata2") no("bomba all'italiana: dopo il cambio " + MI.stato);
    // percentuali spente; uno che esce durante la corsa; una mano normale dopo la bomba
    var M2 = PK.creaMotore("he"); M2.siedi({ id: "a", nome: "A", stack: 1000 }); M2.siedi({ id: "b", nome: "B", stack: 1000 }); M2.nuovaMano();
    M2.azione(M2.turno, "punta", 1000); M2.azione(M2.turno, "chiama");
    if (!M2.corsa || M2.perc) no("percentuali spente: ci sono lo stesso");
    var M3 = PK.creaMotore("he"); M3.conPerc = true;
    ["a", "b", "c"].forEach(function (id) { M3.siedi({ id: id, nome: id, stack: 500 }); }); M3.nuovaMano();
    M3.azione(M3.turno, "punta", 500); M3.azione(M3.turno, "chiama"); M3.azione(M3.turno, "chiama");
    if (!M3.corsa || Object.keys(M3.perc || {}).length !== 3) no("corsa in 3: percentuali " + JSON.stringify(M3.perc));
    M3.esce(0);
    if (M3.perc && M3.perc.a) no("chi è uscito durante la corsa ha ancora la percentuale");
    if (!M3.perc || Object.keys(M3.perc).length !== 2) no("dopo l'uscita le percentuali degli altri due mancano");
    M.azzera(); M.nuovaMano(); if (M.bomba || M.perc) no("la mano dopo la bomba è ancora bomba");
    senzaErrori();
    return note.join(" · ");
  } });

  // =================== g5b: contro i Bot, le percentuali sullo schermo ===================
  COPIONE.aggiungi("g5b", { nome: "Poker contro i Bot: percentuali da TV sullo schermo (si muove solo il numero), chi vince si illumina, misure, «No»", fai: async function () {
    var P = await tel("Paky", { x: 0, monete: 5000 }), note = [];
    P.__imp = { variante: "he", avversari: 4, difficolta: "facile", perc: true };   // (4 Bot: posti anche ai lati, i cartellini non devono uscire dallo schermo)
    await avviaLocale(P, "Poker", "Contro i Bot");
    var fino = Date.now() + 150000, visto = null, d = P.document;
    while (Date.now() < fino && !visto) {
      if (/Fai vedere!/.test(T(P))) { await W.dorme(700); W.clicca(P, /Segreto/); }
      else if (d.querySelector(".pk-azioni .pk-btn.lascia")) await pkHost(P, "allin");
      else if (/Siediti con/.test(T(P))) W.clicca(P, /Siediti con/);
      var bot = visibili(P, ".pk-posto .pk-perc"), mio = visibili(P, ".pk-perc.io");
      if (bot.length && mio.length) visto = { bot: bot[0], mio: mio[0] };
      await W.dorme(150);
    }
    if (!visto) no("in 150 s nessun all-in con le percentuali («" + T(P).slice(0, 80) + "»)");
    var posto = visto.bot.closest(".pk-posto"), valori = [], strade = {}, top = null;
    var t1 = Date.now() + 8000;
    while (Date.now() < t1) {
      var tb = visto.bot.textContent, tm = visto.mio.textContent, nc = d.querySelectorAll(".pk-comuni .pk-cs").length;
      if (!/^\d+%|^<1%/.test(tb) || !/^Tu (\d+%|<1%)/.test(tm)) no("cartellini strani: «" + tb + "» / «" + tm + "»");
      var k = nc + ":" + tm + "|" + tb; if (!strade[k]) { strade[k] = 1; valori.push(nc + " carte → " + tm + " / Bot " + tb); }
      if (!P.document.body.contains(posto)) no("il posto del Bot è stato rifatto durante la corsa");
      if (!P.document.body.contains(visto.bot) || !P.document.body.contains(visto.mio)) no("i cartellini sono stati rifatti (lampeggio)");
      var tp = P.document.querySelector(".pk-perc.top"); if (tp && nc === 5) top = tp;
      visibili(P, ".pk-perc").forEach(function (x) { var r = x.getBoundingClientRect(); if (r.right > P.innerWidth + 1 || r.left < -1) no("un cartellino esce dallo schermo («" + x.textContent + "», " + Math.round(r.left) + "-" + Math.round(r.right) + ")"); });
      if (/Prossima mano/.test(T(P)) && top) break;
      await W.dorme(100);
    }
    note.push(valori.join(" · "));
    if (valori.length < 2) no("le percentuali non cambiano con le carte (" + valori.join(" · ") + ")");
    if (!top) no("a carte finite nessuno si illumina");
    var vinseIo = /Hai vinto|Piatto diviso|Vincono/.test(T(P)), topIo = top.classList.contains("io");
    if (/Hai vinto/.test(T(P)) && !topIo) no("ho vinto io ma si illumina il Bot");
    if (/ vince /.test(T(P)) && topIo && !/Piatto diviso/.test(T(P))) no("vince il Bot ma si illumina il mio cartellino");
    note.push("illuminato: " + (topIo ? "il mio" : "il Bot") + (vinseIo ? "" : ""));
    note.push(await misure(P, "Paky", ".pk-perc, .pk-btn, .pk-posto"));
    W.clicca(P, /^‹$/, ".pk-tastino"); await W.dorme(900);
    // percentuali spente
    P.__imp = { variante: "he", avversari: 1, difficolta: "facile", perc: false };
    await avviaLocale(P, "Poker", "Contro i Bot");
    fino = Date.now() + 120000; var corsa = false;
    while (Date.now() < fino && !corsa) {
      if (/Fai vedere!/.test(T(P))) { await W.dorme(700); W.clicca(P, /Segreto/); }
      else if (P.document.querySelector(".pk-azioni .pk-btn.lascia")) await pkHost(P, "allin");
      else if (/Siediti con/.test(T(P))) W.clicca(P, /Siediti con/);
      if (/Carte scoperte/.test(T(P))) { corsa = true; await W.dorme(1500); if (visibili(P, ".pk-perc").length) no("con «📊 No» i cartellini ci sono lo stesso"); }
      await W.dorme(150);
    }
    if (!corsa) note.push("(con «No» il Bot non ha mai chiamato l'all-in)"); else note.push("con «No» niente cartellini");
    senzaErrori();
    return note.join(" · ");
  } });

  // =================== g5c: online, torneo con la Mano bomba ===================
  COPIONE.aggiungi("g5c", { nome: "Poker online in 3: torneo con «💣 1 ogni 5», chi guarda e chi ricarica, percentuali per tutti, foto pulita", fai: async function () {
    var P = await tel("Paky", { x: 0, monete: 700 }), note = [];
    var C = await W.apriStanza(P, "Poker");
    await tel("Giulia", { hash: "gioco=poker&stanza=" + C, x: 185, monete: 400 });
    await tel("Luca", { hash: "gioco=poker&stanza=" + C, x: 370, monete: 1500 });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("al tavolo non arrivano in 3");
    // il ⚙️: Mano bomba solo col torneo, percentuali solo nel Texas Hold'em
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole, button"); }, 5000)) no("non trovo ⚙️ Regole");
    await W.dorme(300);
    var F = P.document.querySelector(".sl-foglio"); if (!F) no("il foglio delle regole non si apre");
    function riga(re) { return [].find.call(F.querySelectorAll(".etichetta"), function (e) { return re.test(e.textContent); }); }
    function si(re) { var r = riga(re); return !!(r && r.offsetParent !== null); }
    if (!si(/Percentuali all'all-in/)) no("nel ⚙️ non si vede «📊 Percentuali all'all-in»");
    if (si(/Mano bomba/)) no("la «💣 Mano bomba» si vede anche senza torneo");
    W.clicca(P, /All'italiana/, ".sl-foglio .modo-chip"); await W.dorme(150);
    if (si(/Percentuali all'all-in/)) no("all'italiana si vede ancora «Percentuali all'all-in»");
    W.clicca(P, /Texas Hold'em/, ".sl-foglio .modo-chip"); await W.dorme(150);
    W.clicca(P, /Fiches uguali/, ".sl-foglio .modo-chip"); await W.dorme(150);
    if (!si(/Mano bomba/)) no("col torneo non compare la «💣 Mano bomba»");
    if (!W.clicca(P, /^1 ogni 5$/, ".sl-foglio .modo-chip")) no("non trovo «1 ogni 5»");
    await W.dorme(150);
    W.clicca(P, /Fatto|Ok/, ".sl-foglio button"); await W.dorme(600);
    if (!await W.aspetta(function () { return vm(C).torneo && vm(C).torneo.bomba === 5 && vm(C).percSi === true; }, 4000)) no("la foto non ha torneo con bomba 5 e percentuali accese (" + JSON.stringify(vm(C).torneo) + ")");
    var G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return /mano bomba ogni 5/.test(A.regoleDi(G)); }, 4000)) no("la riga «Si gioca così» di Giulia non dice della mano bomba («" + A.regoleDi(G) + "»)");
    if (!/Mano bomba/.test(T(G))) no("nella saletta di Giulia la nota del torneo non dice della Mano bomba");
    note.push("Giulia legge: «" + A.regoleDi(G) + "»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).n >= 1; }, 6000)) no("la partita non comincia");
    var G0 = guardia(C), ids = nomiId(["Giulia", "Luca"]), n1 = vm(C).n, totale = somma(vm(C)), S = null;
    try {
      for (var m = 0; m < 4; m++) {
        var v = await pkMano(C, ids, function () { return "passa"; }, 40000);
        if (v.bomba) no("la mano " + v.n + " è bomba (doveva essere la " + (n1 + 4) + ")");
        if (!await W.aspetta(function () { return vm(C).n > v.n && vm(C).stato !== "finemano"; }, 8000)) no("la mano dopo la " + v.n + " non parte");
        if (m === 0) {   // Sara arriva a torneo iniziato: guarda
          S = await tel("Sara", { hash: "gioco=poker&stanza=" + C, x: 555 });
          if (!await W.aspetta(function () { return (vm(C).guardano || []).indexOf(A.mioId("Sara")) >= 0; }, 6000)) no("Sara non guarda");
        }
      }
      // la 5ª mano: la bomba
      var vb = vm(C);
      if (vb.n !== n1 + 4 || vb.bomba !== 40) no("la mano " + vb.n + " non è la Mano bomba da 40 (bomba " + vb.bomba + ", bui " + JSON.stringify(vb.bui) + ")");
      if (vb.stato !== "flop" || vb.tavolo.length !== 3) no("nella Mano bomba non si parte dal flop (" + vb.stato + ", " + vb.tavolo.length + " carte)");
      if (vb.piatto !== 120 || vb.daChiamare !== 0) no("Mano bomba: piatto " + vb.piatto + " invece di 120 (da chiamare " + vb.daChiamare + ")");
      if (!vb.players.every(function (p) { return /^💣 40$/.test(p.azione); })) no("Mano bomba: le scritte sono " + vb.players.map(function (p) { return p.azione; }).join(" / "));
      if (somma(vb) !== totale) no("le fiches non tornano nella Mano bomba (" + somma(vb) + " invece di " + totale + ")");
      var ban = await W.aspetta(function () { return G.document.querySelector(".pk-bomba"); }, 3000);
      if (!ban || !/MANO BOMBA/.test(ban.textContent) || !/40/.test(ban.textContent)) no("su Giulia niente annuncio «💣 MANO BOMBA!» (" + (ban ? ban.textContent : "") + ")");
      if (!P.document.querySelector(".pk-bomba")) no("sull'host niente annuncio della Mano bomba");
      if (!(G.__vibra || []).length) no("il telefono di Giulia non vibra alla Mano bomba");
      note.push("Giulia: «" + ban.textContent.replace(/\s+/g, " ") + "», vibra " + JSON.stringify(G.__vibra));
      if (!/💣 Piatto 120/.test(T(G))) no("sul piatto di Giulia non c'è 💣 («" + T(G).slice(0, 90) + "»)");
      note.push(await misure(G, "Giulia", ".pk-bomba, .pk-btn, .pk-posto"));
      // Luca ricarica a mano bomba cominciata: niente annuncio, il 💣 sul piatto sì
      await W.ricarica("Luca", { g5: true, prima: function (x) { spiaMonete(x, 1500); } });
      var L = W.finestra("Luca");
      if (!await W.aspetta(function () { return /💣 Piatto/.test(T(L)); }, 6000)) no("Luca, ricaricato, non vede il 💣 sul piatto («" + T(L).slice(0, 80) + "»)");
      if (L.document.querySelector(".pk-bomba")) no("Luca, ricaricato, vede di nuovo l'annuncio della Mano bomba");
      ids = nomiId(["Giulia", "Luca"]);
      // tutti all-in: le percentuali le vedono anche Giulia e Sara (che guarda)
      var corre = pkMano(C, ids, function () { return "allin"; }, 40000);
      var vc = await W.aspetta(function () { var x = vm(C); return x.corsa && x.perc ? x : null; }, 20000);
      if (!vc) no("dopo gli all-in nessuna corsa con le percentuali");
      note.push("percentuali: " + JSON.stringify(vc.perc) + " con " + vc.tavolo.length + " carte");
      var nPerc = Object.keys(vc.perc).length;
      if (!await W.aspetta(function () { return visibili(S, ".pk-perc").length === nPerc; }, 3000)) no("Sara (che guarda) vede " + visibili(S, ".pk-perc").length + " cartellini invece di " + nPerc);
      if (visibili(S, ".pk-perc.io").length) no("Sara guarda ma ha un cartellino «Tu»");
      var gid = A.mioId("Giulia");
      if (vc.perc[gid] && !await W.aspetta(function () { return visibili(G, ".pk-perc.io").length === 1; }, 3000)) no("Giulia non vede la sua percentuale «Tu …»");
      if (vc.perc[gid] && !/^Tu /.test(visibili(G, ".pk-perc.io")[0].textContent)) no("il cartellino di Giulia non dice «Tu»");
      note.push(await misure(S, "Sara", ".pk-perc, .pk-posto"));
      await corre;
      // poi tutti all-in fino alla fine del torneo
      var fino = Date.now() + 160000, bombe = {};
      while (Date.now() < fino && vm(C).fase === "gioco") {
        var vx = vm(C); if (vx.bomba) bombe[vx.n] = vx.bomba;
        await pkMano(C, ids, function () { return "allin"; }, 30000);
        await W.dorme(300);
      }
      Object.keys(bombe).forEach(function (n) { if ((+n - n1 + 1) % 5) no("bomba alla mano " + n + " (non è una ogni 5)"); });
      if (vm(C).fase !== "fine") no("il torneo non arriva alla fine");
      note.push("mani bomba: " + JSON.stringify(bombe) + " · percentuali in " + G0.conPerc + " foto su " + G0.visti);
    } finally { G0.stop = true; }
    if (G0.errori.length) no("foto sbagliate: " + G0.errori.slice(0, 4).join(" · "));
    ["Paky", "Giulia", "Luca", "Sara"].forEach(function (n) { var w = W.finestra(n); if (w && w.__salvaF) no(n + " ha salvato le monete nel torneo (" + w.__salvaF + ")"); });
    senzaErrori();
    return note.join(" · ");
  } });

  // =================== g5d: contro i Bot all'italiana, Mano bomba ===================
  COPIONE.aggiungi("g5d", { nome: "Poker all'italiana contro i Bot, torneo con «💣 1 ogni 5»: la bomba va subito al cambio, mai percentuali", fai: async function () {
    var P = await tel("Paky", { x: 0, monete: 5 }), note = [], d;
    P.__imp = { variante: "it", avversari: 2, difficolta: "facile", torneo: true, ogni: 10, bomba: 5, perc: true };
    await avviaLocale(P, "Poker", "Contro i Bot");
    d = P.document;
    var fino = Date.now() + 150000, bomba = null, perc = 0, mani = {};
    while (Date.now() < fino && !bomba) {
      if (visibili(P, ".pk-perc").length) perc++;
      var info = (d.querySelector(".pk-info") || {}).textContent || "", msg = (d.querySelector(".pk-msg") || {}).textContent || "";
      var ban = d.querySelector(".pk-bomba");
      if (ban || /💣/.test(msg)) bomba = { ban: ban ? ban.textContent : "", msg: msg, piatto: (d.querySelector(".pk-piatto") || {}).textContent, punta: !!d.querySelector(".pk-azioni .pk-btn.lascia") };
      else if (/Fai vedere!/.test(T(P))) { await W.dorme(700); W.clicca(P, /Segreto/); }
      else if (/Servito/.test(T(P))) W.clicca(P, /Servito/);
      else if (d.querySelector(".pk-azioni .pk-btn.lascia")) await pkHost(P, "passa");
      if (/Classifica del torneo/.test(T(P))) no("il torneo finisce prima della Mano bomba");
      await W.dorme(150);
    }
    if (!bomba) no("in 150 s nessuna Mano bomba all'italiana");
    if (!/MANO BOMBA/.test(bomba.ban)) no("niente annuncio grande («" + bomba.ban + "»)");
    if (!/si cambia subito/.test(bomba.ban)) no("l'annuncio non dice che si cambia subito («" + bomba.ban + "»)");
    if (!/💣 Mano bomba · 🔄 Cambio/.test(bomba.msg)) no("la scritta in mezzo è «" + bomba.msg + "»");
    if (!/💣 Piatto 120/.test(bomba.piatto)) no("il piatto della bomba (3 × 40) è «" + bomba.piatto + "»");
    if (bomba.punta) no("nella bomba si punta prima del cambio");
    if (!(P.__vibra || []).length) no("niente vibrazione alla Mano bomba");
    note.push("«" + bomba.ban.replace(/\s+/g, " ") + "» · «" + bomba.msg + "» · «" + bomba.piatto + "»");
    note.push(await misure(P, "Paky", ".pk-bomba, .pk-btn, .pk-carta"));
    if (perc) no("percentuali nel Poker all'italiana");
    W.clicca(P, /Servito/); await W.dorme(1500);
    W.clicca(P, /^‹$/, ".pk-tastino"); await W.dorme(900);
    if (P.__salvaF) no("contro i Bot nel torneo si sono salvate monete (" + P.__salvaF + ")");
    senzaErrori();
    return note.join(" · ");
  } });
})();
