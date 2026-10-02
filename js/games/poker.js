/* =========================================================
   POKER con le carte francesi: Texas Hold'em e Poker all'italiana.
   Contro il computer (tu e i bot, il primo è Matt) oppure online, ognuno dal suo telefono
   (i posti vuoti l'host li può dare ai bot).
   Si gioca con le fiches del Black Jack (un portafoglio solo): ci si siede con al massimo 1.000
   e nel profilo si salva sempre "fiches fuori dal tavolo + fiches sul tavolo".
   Online l'host tiene la partita (motore qui sotto) e manda a tutti la foto (vm) SENZA le carte
   coperte; ognuno riceve le sue carte a parte (inviaVeloce + to).
   ========================================================= */
(function () {
  "use strict";

  var ID = "poker";
  var MIN = 2, MAX = { he: 10, it: 6 };
  var BUYIN = 1000;                    // con quante fiches ci si siede, al massimo
  var PICCOLO = 10, GRANDE = 20;       // Texas Hold'em: i bui
  var INVITO = 10, PUNTA_IT = 20;      // all'italiana: l'invito di tutti e la puntata più piccola
  var T_MOSSA = 30000;                 // online: tempo per decidere, poi passa (o lascia) da solo
  var NOMI_BOT = ["Matt", "Rosa", "Peppe", "Gina", "Tonio", "Lia", "Dino", "Pina", "Ciro", "Nina", "Totò", "Lella"];
  var SEMI = ["♠", "♥", "♦", "♣"], ROSSO = { 1: 1, 2: 1 };
  var FORZA_SEME = [1, 4, 3, 2];       // all'italiana, a parità: cuori, quadri, fiori, picche
  var FIGURE = { 1: "A", 11: "J", 12: "Q", 13: "K" };
  var NOME_VAR = { he: "Texas Hold'em", it: "Poker all'italiana" };
  var PUNTATE = { preflop: 1, flop: 1, turn: 1, river: 1, puntata1: 1, puntata2: 1 };

  function BJ() { return window.__BJ || null; }
  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function rango(c) { return c.v === 1 ? 14 : c.v; }
  function testoCarta(c) { return (FIGURE[c.v] || String(c.v)) + SEMI[c.s]; }
  function conProfilo() { return !!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo()); }
  function portafoglio() { var f = conProfilo() && SGNube.fiches ? SGNube.fiches("blackjack") : null; return f == null ? 0 : f; }
  function svuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }

  // =========================================================
  //  CARTE E PUNTI
  // =========================================================
  // all'italiana il mazzo si accorcia: dal (11 − giocatori) in su (in 4: dal 7, 32 carte)
  function bassoIt(n) { return Math.max(2, 11 - n); }
  function creaMazzo(variante, n) {
    var basso = variante === "it" ? bassoIt(n) : 2, m = [];
    for (var s = 0; s < 4; s++) { m.push({ v: 1, s: s }); for (var v = basso; v <= 13; v++) m.push({ v: v, s: s }); }
    return mischia(m);
  }
  // dal più basso al più alto; all'italiana il colore batte il full (col mazzo corto è più raro)
  var ORDINE = { he: ["alta", "coppia", "doppia", "tris", "scala", "colore", "full", "poker", "scalacolore"],
                 it: ["alta", "coppia", "doppia", "tris", "scala", "full", "colore", "poker", "scalacolore"] };
  var NOMI_MANO = { alta: "Carta alta", coppia: "Coppia", doppia: "Doppia coppia", tris: "Tris", scala: "Scala", colore: "Colore", full: "Full", poker: "Poker", scalacolore: "Scala colore" };
  // valuta fino a 5 carte: { v: [tipo, poi le carte che decidono a parità], tipo, nome }
  function valuta5(cc, variante, basso) {
    var r = cc.map(rango).sort(function (a, b) { return b - a; });
    var conta = {}; r.forEach(function (x) { conta[x] = (conta[x] || 0) + 1; });
    var gruppi = Object.keys(conta).map(Number).sort(function (a, b) { return conta[b] - conta[a] || b - a; });
    var colore = cc.length === 5 && cc.every(function (c) { return c.s === cc[0].s; });
    var scala = 0;
    if (cc.length === 5 && gruppi.length === 5) {
      if (r[0] - r[4] === 4) scala = r[0];
      else if (r[0] === 14 && r[1] === basso + 3 && r[4] === basso) scala = basso + 3;   // l'asso sotto: 5-4-3-2-A (all'italiana A-7-8-9-10 col mazzo dal 7)
    }
    var c0 = conta[gruppi[0]], c1 = conta[gruppi[1]], tipo, dopo;
    if (scala && colore) { tipo = "scalacolore"; dopo = [scala]; }
    else if (c0 === 4) { tipo = "poker"; dopo = gruppi; }
    else if (c0 === 3 && c1 === 2) { tipo = "full"; dopo = gruppi; }
    else if (colore) { tipo = "colore"; dopo = r; }
    else if (scala) { tipo = "scala"; dopo = [scala]; }
    else if (c0 === 3) { tipo = "tris"; dopo = gruppi; }
    else if (c0 === 2 && c1 === 2) { tipo = "doppia"; dopo = gruppi; }
    else if (c0 === 2) { tipo = "coppia"; dopo = gruppi; }
    else { tipo = "alta"; dopo = r; }
    var v = [ORDINE[variante].indexOf(tipo)].concat(dopo);
    if (variante === "it") {   // a parità decide il seme della carta più importante (cuori, quadri, fiori, picche)
      var semeTop = 0;
      cc.forEach(function (c) { if (rango(c) === dopo[0]) semeTop = Math.max(semeTop, FORZA_SEME[c.s]); });
      v.push(semeTop);
    }
    return { v: v, tipo: tipo, nome: NOMI_MANO[tipo] };
  }
  function confronta(a, b) {
    for (var i = 0; i < Math.max(a.length, b.length); i++) { var x = a[i] || 0, y = b[i] || 0; if (x !== y) return x - y; }
    return 0;
  }
  // la mano migliore: con 6 o 7 carte (Hold'em) prova tutte le combinazioni da 5
  function miglioreMano(carte, variante, basso) {
    if (carte.length <= 5) return valuta5(carte, variante, basso);
    var best = null, n = carte.length, i, j;
    function prova(cinque) { var x = valuta5(cinque, variante, basso); if (!best || confronta(x.v, best.v) > 0) best = x; }
    if (n === 6) for (i = 0; i < 6; i++) prova(carte.filter(function (c, k) { return k !== i; }));
    else for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) prova(carte.filter(function (c, k) { return k !== i && k !== j; }));
    return best;
  }

  // =========================================================
  //  MOTORE DELLA PARTITA (uguale contro il computer e online)
  // =========================================================
  function creaMotore(variante) {
    var M = { variante: variante, giocatori: [], dealer: -1, mazzo: [], scarti: [], tavolo: [], piatto: 0, daChiamare: 0, rilMin: 0,
      turno: -1, stato: "attesa", n: 0, esito: null, basso: 2, corsa: false, scadenza: null };
    function minimo() { return M.variante === "he" ? GRANDE : PUNTA_IT; }
    function attivi() { return M.giocatori.filter(function (p) { return p.seduto && !p.via && p.stack > 0; }); }
    function inMano() { return M.giocatori.filter(function (p) { return p.inMano && !p.lascia; }); }
    function puoMuovere(p) { return p.inMano && !p.lascia && !p.allin; }
    function deveParlare(p) { return puoMuovere(p) && (!p.agito || p.inGiro < M.daChiamare); }
    function dopo(i, ok) { var n = M.giocatori.length; for (var k = 1; k <= n; k++) { var j = ((i + k) % n + n) % n; if (ok(M.giocatori[j])) return j; } return -1; }
    function metti(p, x) { x = Math.max(0, Math.min(Math.floor(x), p.stack)); p.stack -= x; p.inGiro += x; p.messo += x; if (p.stack === 0) p.allin = true; return x; }
    function pesca() { if (!M.mazzo.length) { M.mazzo = mischia(M.scarti); M.scarti = []; } return M.mazzo.pop(); }

    M.siedi = function (o) {
      var st = Math.max(0, Math.floor(o.stack || 0));
      var p = { id: o.id, nome: o.nome, omino: o.omino || null, bot: !!o.bot, stack: st, buyin: st, seduto: st > 0, via: false,
        inMano: false, lascia: false, allin: false, inGiro: 0, messo: 0, mano: [], agito: false, azione: "", mostra: false, cambio: null, valut: null };
      M.giocatori.push(p); return p;
    };
    M.trova = function (id) { for (var i = 0; i < M.giocatori.length; i++) if (M.giocatori[i].id === id) return i; return -1; };
    M.piattoTot = function () { var s = M.piatto; M.giocatori.forEach(function (p) { s += p.inGiro; }); return s; };
    M.inCorso = function () { return M.stato !== "attesa" && M.stato !== "finemano"; };

    M.nuovaMano = function () {
      M.giocatori.forEach(function (p) { p.inMano = false; p.lascia = false; p.allin = false; p.inGiro = 0; p.messo = 0; p.mano = []; p.agito = false; p.azione = ""; p.mostra = false; p.cambio = null; p.valut = null; });
      M.esito = null; M.tavolo = []; M.piatto = 0; M.scarti = []; M.corsa = false; M.turno = -1;
      var gioc = attivi();
      if (gioc.length < MIN) { M.stato = "attesa"; return false; }
      M.n++;
      gioc.forEach(function (p) { p.inMano = true; });
      function siMano(p) { return p.inMano; }
      M.dealer = dopo(M.dealer, siMano);
      M.basso = M.variante === "it" ? bassoIt(gioc.length) : 2;
      M.mazzo = creaMazzo(M.variante, gioc.length);
      if (M.variante === "he") {
        var sb = gioc.length === 2 ? M.dealer : dopo(M.dealer, siMano), bb = dopo(sb, siMano);   // in due il mazziere mette il buio piccolo
        metti(M.giocatori[sb], PICCOLO); M.giocatori[sb].azione = "Buio " + PICCOLO;
        metti(M.giocatori[bb], GRANDE); M.giocatori[bb].azione = "Buio " + GRANDE;
        gioc.forEach(function (p) { p.mano = [pesca(), pesca()]; });
        M.daChiamare = GRANDE; M.rilMin = GRANDE; M.stato = "preflop";
        M.turno = dopo(bb, puoMuovere);
      } else {
        gioc.forEach(function (p) {   // l'invito va nel piatto (non è una puntata del giro)
          var x = Math.min(INVITO, p.stack); p.stack -= x; p.messo += x; M.piatto += x; if (p.stack === 0) p.allin = true;
          p.azione = "Invito"; p.mano = [pesca(), pesca(), pesca(), pesca(), pesca()];
        });
        M.daChiamare = 0; M.rilMin = PUNTA_IT; M.stato = "puntata1";
        M.turno = dopo(M.dealer, puoMuovere);
      }
      controlla();
      return true;
    };
    // chi deve ancora parlare? Se nessuno, il giro di puntate è chiuso
    function controlla() {
      if (!PUNTATE[M.stato]) return;
      var rest = inMano();
      if (rest.length <= 1) return vinceSolo(rest[0]);
      if (M.turno >= 0 && deveParlare(M.giocatori[M.turno])) return;
      var j = dopo(M.turno, deveParlare);
      if (j >= 0) { M.turno = j; return; }
      chiudiGiro();
    }
    M.possibili = function (i) {
      var p = M.giocatori[i];
      if (i !== M.turno || !p || !puoMuovere(p) || !PUNTATE[M.stato]) return null;
      var serve = Math.max(0, M.daChiamare - p.inGiro), tutto = p.inGiro + p.stack;
      return { passa: serve === 0, chiama: serve > 0 ? Math.min(serve, p.stack) : 0,
        punta: tutto > M.daChiamare ? { min: Math.min(M.daChiamare + M.rilMin, tutto), max: tutto } : null };
    };
    // tipo: lascia | passa | chiama | punta (tot = a quanto arriva la mia puntata in questo giro)
    M.azione = function (i, tipo, tot) {
      var pos = M.possibili(i); if (!pos) return false;
      var p = M.giocatori[i], prima = M.daChiamare;
      if (tipo === "lascia") { p.lascia = true; p.azione = "Lascia"; }
      else if (tipo === "passa") { if (!pos.passa) return false; p.azione = "Passa"; }
      else if (tipo === "chiama") { if (!pos.chiama) return false; metti(p, pos.chiama); p.azione = p.allin ? "All-in" : "Chiama"; }
      else if (tipo === "punta") {
        if (!pos.punta) return false;
        tot = Math.max(pos.punta.min, Math.min(pos.punta.max, Math.floor(+tot || 0)));
        metti(p, tot - p.inGiro);
        if (tot > prima) {
          if (tot - prima >= M.rilMin) M.rilMin = tot - prima;
          M.daChiamare = tot;
          M.giocatori.forEach(function (q) { if (q !== p) q.agito = false; });   // gli altri devono rispondere
        }
        p.azione = p.allin ? "All-in" : (prima === 0 ? "Punta" : "Rilancia");
      } else return false;
      p.agito = true;
      controlla();
      return true;
    };
    function chiudiGiro() {
      M.giocatori.forEach(function (q) { M.piatto += q.inGiro; q.inGiro = 0; q.agito = false; });
      M.daChiamare = 0; M.rilMin = minimo(); M.turno = -1;
      var conFiches = inMano().filter(function (q) { return !q.allin; }).length;
      if (M.variante === "he") {
        if (M.stato === "river") return showdown();
        if (conFiches <= 1) { M.corsa = true; return; }   // tutti all-in (o quasi): le carte escono da sole, una strada alla volta
        prossimaStrada();
        M.giocatori.forEach(function (q) { if (puoMuovere(q)) q.azione = ""; });
        M.turno = dopo(M.dealer, puoMuovere);
        controlla();
      } else {
        if (M.stato === "puntata1") {
          M.stato = "cambio";
          inMano().forEach(function (q) { q.cambio = null; if (!q.allin) q.azione = ""; });
          return;
        }
        showdown();
      }
    }
    function prossimaStrada() {
      M.stato = M.stato === "preflop" ? "flop" : M.stato === "flop" ? "turn" : "river";
      var k = M.stato === "flop" ? 3 : 1;
      while (k--) M.tavolo.push(pesca());
    }
    M.corsaPasso = function () {
      if (!M.corsa) return;
      if (M.stato === "river") { M.corsa = false; return showdown(); }
      prossimaStrada();
    };
    // all'italiana: si cambiano da 0 a 4 carte (quali = posizioni nella mano)
    M.cambia = function (i, quali) {
      var p = M.giocatori[i];
      if (M.stato !== "cambio" || !p || !p.inMano || p.lascia || p.cambio != null) return false;
      var visti = {};
      quali = (quali || []).map(Number).filter(function (k) { if (k >= 0 && k < 5 && !visti[k]) { visti[k] = 1; return true; } return false; }).slice(0, 4);
      quali.forEach(function (k) { M.scarti.push(p.mano[k]); p.mano[k] = pesca(); });
      p.cambio = quali.length; p.azione = quali.length ? "Cambia " + quali.length : "Servito";
      forseFineCambio();
      return true;
    };
    function forseFineCambio() {
      var rest = inMano();
      if (rest.length <= 1) return vinceSolo(rest[0]);
      if (!rest.every(function (q) { return q.cambio != null; })) return;
      M.stato = "puntata2";
      M.giocatori.forEach(function (q) { q.agito = false; });
      if (rest.filter(function (q) { return !q.allin; }).length <= 1) return showdown();
      M.turno = dopo(M.dealer, puoMuovere);
      controlla();
    }
    // chi se ne va: lascia la mano (le fiches puntate restano nel piatto)
    M.esce = function (i) {
      var p = M.giocatori[i]; if (!p) return;
      p.via = true; p.seduto = false;
      if (!M.inCorso() || !p.inMano || p.lascia) return;
      p.lascia = true; p.azione = "Uscito";
      if (M.stato === "cambio") forseFineCambio();
      else if (M.corsa) { if (inMano().length <= 1) vinceSolo(inMano()[0]); }
      else controlla();
    };
    // i piatti: chi è all-in vince solo fino a quanto ha messo (piatti laterali per gli altri)
    function calcolaPiatti() {
      var livelli = [];
      M.giocatori.forEach(function (p) { if (p.messo > 0 && livelli.indexOf(p.messo) < 0) livelli.push(p.messo); });
      livelli.sort(function (a, b) { return a - b; });
      var res = [], prec = 0;
      livelli.forEach(function (L) {
        var quota = 0;
        M.giocatori.forEach(function (p) { quota += Math.max(0, Math.min(p.messo, L) - prec); });
        var aventi = M.giocatori.filter(function (p) { return p.inMano && !p.lascia && p.messo >= L; });
        var ultimo = res[res.length - 1];
        if (quota > 0) {
          if (ultimo && ultimo.aventi.length === aventi.length && ultimo.aventi.every(function (q) { return aventi.indexOf(q) >= 0; })) ultimo.importo += quota;
          else if (aventi.length) res.push({ importo: quota, aventi: aventi });
          else if (ultimo) ultimo.importo += quota;
        }
        prec = L;
      });
      return res;
    }
    function showdown() {
      M.turno = -1; M.corsa = false;
      M.giocatori.forEach(function (q) { M.piatto += q.inGiro; q.inGiro = 0; });
      var rest = inMano(), n = M.giocatori.length, vinti = {};
      function dist(q) { var d = (M.giocatori.indexOf(q) - M.dealer + n) % n; return d === 0 ? n : d; }   // il primo alla sinistra del mazziere
      rest.forEach(function (q) { q.valut = miglioreMano(M.variante === "he" ? q.mano.concat(M.tavolo) : q.mano, M.variante, M.basso); q.mostra = true; });
      calcolaPiatti().forEach(function (pt) {
        var best = null, chi = [];
        pt.aventi.forEach(function (q) { var c = best ? confronta(q.valut.v, best.valut.v) : 1; if (c > 0) { best = q; chi = [q]; } else if (c === 0) chi.push(q); });
        chi.sort(function (a, b) { return dist(a) - dist(b); });
        var quota = Math.floor(pt.importo / chi.length), resto = pt.importo - quota * chi.length;
        chi.forEach(function (q, k) { var x = quota + (k < resto ? 1 : 0); q.stack += x; vinti[q.id] = (vinti[q.id] || 0) + x; });
      });
      M.piatto = 0; M.stato = "finemano"; M.esito = { vinti: vinti, confronto: true };
    }
    function vinceSolo(p) {   // gli altri hanno lasciato: prende tutto senza far vedere le carte
      M.giocatori.forEach(function (q) { M.piatto += q.inGiro; q.inGiro = 0; });
      var tot = M.piatto, vinti = {}; M.piatto = 0;
      if (p) { p.stack += tot; vinti[p.id] = tot; }
      M.turno = -1; M.corsa = false; M.stato = "finemano"; M.esito = { vinti: vinti, confronto: false };
    }
    // fine partita a metà mano: le fiches messe in questa mano tornano a chi le ha messe
    M.annulla = function () {
      if (!M.inCorso()) return;
      M.giocatori.forEach(function (q) { q.stack += q.messo; q.messo = 0; q.inGiro = 0; q.inMano = false; q.mano = []; q.allin = false; });
      M.piatto = 0; M.turno = -1; M.corsa = false; M.stato = "attesa"; M.esito = null; M.tavolo = [];
    };
    return M;
  }

  // =========================================================
  //  BOT
  // =========================================================
  // Hold'em: quante volte vincerei, provando a caso le carte che mancano (pari = metà)
  function equita(mie, tavolo, nAvv, prove) {
    nAvv = Math.max(1, Math.min(nAvv, 5));
    var usate = {}; mie.concat(tavolo).forEach(function (c) { usate[c.v + "-" + c.s] = 1; });
    var resto = [];
    for (var s = 0; s < 4; s++) for (var v = 1; v <= 13; v++) if (!usate[v + "-" + s]) resto.push({ v: v, s: s });
    var serve = 5 - tavolo.length + nAvv * 2, vinte = 0;
    for (var k = 0; k < prove; k++) {
      for (var a = 0; a < serve; a++) { var j = a + Math.floor(Math.random() * (resto.length - a)), x = resto[a]; resto[a] = resto[j]; resto[j] = x; }
      var tav = tavolo.concat(resto.slice(0, 5 - tavolo.length)), pos = 5 - tavolo.length;
      var mio = miglioreMano(mie.concat(tav), "he", 2).v, perso = false, pari = 0;
      for (var o = 0; o < nAvv; o++) {
        var c = confronta(mio, miglioreMano([resto[pos], resto[pos + 1]].concat(tav), "he", 2).v); pos += 2;
        if (c < 0) { perso = true; break; }
        if (c === 0) pari++;
      }
      if (!perso) vinte += 1 / (pari + 1);
    }
    return vinte / prove;
  }
  // all'italiana: una stima dal tipo di mano (contro più avversari vale meno)
  function forzaIt(mano, basso, nAvv) {
    var v = valuta5(mano, "it", basso), base;
    switch (v.tipo) {
      case "alta": base = 0.18 + (v.v[1] - 10) * 0.02; break;
      case "coppia": base = 0.42 + (v.v[1] - 7) * 0.025; break;
      case "doppia": base = 0.7; break;
      case "tris": base = 0.84; break;
      case "scala": base = 0.9; break;
      case "full": base = 0.95; break;
      case "colore": base = 0.97; break;
      default: base = 0.995;
    }
    return Math.pow(Math.max(0.05, Math.min(0.995, base)), Math.sqrt(Math.max(1, nAvv)));
  }
  function decidiBot(M, i, liv) {
    var p = M.giocatori[i], pos = M.possibili(i); if (!pos) return null;
    var avv = M.giocatori.filter(function (q) { return q !== p && q.inMano && !q.lascia; }).length || 1;
    var forza = M.variante === "he" ? equita(p.mano, M.tavolo, avv, 110) : forzaIt(p.mano, M.basso, avv);
    var rumore = { facile: 0.2, medio: 0.08, difficile: 0.03 }[liv]; if (rumore == null) rumore = 0.08;
    forza = Math.max(0, Math.min(1, forza + (Math.random() * 2 - 1) * rumore));
    var rel = forza * (avv + 1);   // 1 = una mano qualsiasi; 2 = il doppio della media
    var piatto = M.piattoTot(), chiama = pos.chiama || 0;
    var bluff = Math.random() < (liv === "facile" ? 0.02 : liv === "difficile" ? 0.07 : 0.04);
    function punta(fraz) {
      if (!pos.punta) return chiama ? { tipo: "chiama" } : { tipo: "passa" };
      var tot = M.daChiamare + Math.max(M.rilMin, Math.round(piatto * fraz / 10) * 10);
      return { tipo: "punta", tot: Math.min(pos.punta.max, Math.max(pos.punta.min, tot)) };
    }
    if (pos.passa) {
      if (rel > 1.5 || bluff) return punta(rel > 2 ? 0.8 : 0.6);
      if (rel > 1.15 && Math.random() < 0.5) return punta(0.5);
      return { tipo: "passa" };
    }
    var quota = chiama / (piatto + chiama);
    if (rel > 1.9 && Math.random() < 0.6) return punta(0.9);
    if (bluff && Math.random() < 0.4 && chiama < p.stack * 0.2) return punta(1);
    if (forza >= quota * (liv === "facile" ? 0.7 : 1.15) || (chiama <= M.rilMin && rel > 0.9)) return { tipo: "chiama" };
    return { tipo: "lascia" };
  }
  // all'italiana: quali carte cambiare (tiene coppie, tris, e 4 carte a colore o a scala)
  function cambioBot(mano, basso) {
    var v = valuta5(mano, "it", basso), r = mano.map(rango), k;
    if (["scala", "colore", "full", "poker", "scalacolore"].indexOf(v.tipo) >= 0) return [];
    var conta = {}; r.forEach(function (x) { conta[x] = (conta[x] || 0) + 1; });
    if (v.tipo !== "alta") { var q = []; for (k = 0; k < 5; k++) if (conta[r[k]] === 1) q.push(k); return q; }
    var semi = {}; mano.forEach(function (c) { semi[c.s] = (semi[c.s] || 0) + 1; });
    for (var s in semi) if (semi[s] === 4) { for (k = 0; k < 5; k++) if (String(mano[k].s) !== s) return [k]; }
    var ord = r.map(function (x, i) { return { x: x, i: i }; }).sort(function (a, b) { return a.x - b.x; });
    if (ord[3].x - ord[0].x === 3) return [ord[4].i];   // le 4 più basse in fila
    if (ord[4].x - ord[1].x === 3) return [ord[0].i];   // le 4 più alte in fila
    return ord.slice(0, 4).map(function (o) { return o.i; });   // tiene solo la carta più alta
  }

  // =========================================================
  //  SUONI (niente vibrazione: vibra solo quando tocchi tu)
  // =========================================================
  function suono(tipo) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t0 = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo === "carta" ? "triangle" : "square";
      o.frequency.setValueAtTime(tipo === "carta" ? 520 : 1400, t0);
      o.frequency.exponentialRampToValueAtTime(tipo === "carta" ? 260 : 900, t0 + 0.07);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(tipo === "carta" ? 0.08 : 0.05, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.1);
    } catch (e) {}
  }

  // =========================================================
  //  LA PARTITA SU QUESTO TELEFONO: contro il computer, oppure host online
  // =========================================================
  function partita(t, online) {
    if (online && !(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var V = { variante: variante(imp.variante), liv: imp.difficolta || "medio" };
    var prof = conProfilo();
    var nome = (t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Tu";
    var W = prof ? portafoglio() : BUYIN;   // il mio portafoglio (le fiches del Black Jack); senza profilo 1.000 per giocare
    if (prof && W < GRANDE) return senzaFiches(t, function () { partita(t, online); });
    var M = creaMotore(V.variante);
    var io = M.siedi({ id: "host", nome: nome, omino: t.mioOmino ? t.mioOmino(nome) : null, stack: Math.min(W, BUYIN) });
    var fuori = W - io.stack;   // quello che resta nel portafoglio, fuori dal tavolo
    var H = { fase: online ? "lobby" : "gioco", codice: "…", pronta: !online, classifica: null, omini: { host: io.omino } };
    var rete = null, tBot = null, tTempo = null, tMano = null, tSalva = null, salvato = W;

    function salvaMio(subito) {   // nel profilo: fiches fuori + fiches sul tavolo
      if (!prof) return;
      clearTimeout(tSalva);
      var fai = function () { var tot = fuori + io.stack; if (tot !== salvato) { salvato = tot; SGNube.salvaFiches("blackjack", tot); } };
      if (subito) fai(); else tSalva = setTimeout(fai, 1500);
    }
    function aggiungiBot() {
      var usati = {}; M.giocatori.forEach(function (p) { if (!p.via) usati[p.nome] = 1; });
      var nomeB = NOMI_BOT.filter(function (n) { return !usati[n]; })[0] || ("Bot " + (M.giocatori.length + 1));
      return M.siedi({ id: "bot" + Math.random().toString(36).slice(2, 7), nome: nomeB, bot: true, stack: BUYIN, omino: window.SGOmino ? SGOmino.casuale(nomeB) : null });
    }
    function seduti() { return M.giocatori.filter(function (p) { return !p.via; }); }
    function ferma() { clearTimeout(tBot); clearTimeout(tTempo); tBot = tTempo = null; M.scadenza = null; }

    // ---- la foto per tutti: MAI le carte coperte (quelle vanno con privato) ----
    function vm() {
      var tp = M.turno >= 0 ? M.giocatori[M.turno] : null;
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, variante: M.variante, stato: M.stato, n: M.n,
        tavolo: M.tavolo.slice(), piatto: M.piattoTot(), daChiamare: M.daChiamare, rilMin: M.rilMin,
        turno: tp ? tp.id : null, dealer: M.dealer >= 0 && M.giocatori[M.dealer] ? M.giocatori[M.dealer].id : null,
        vinti: M.esito ? M.esito.vinti : null, classifica: H.classifica,
        players: seduti().map(function (p) {
          return { id: p.id, nome: p.nome, bot: p.bot, stack: p.stack, inGiro: p.inGiro, lascia: p.lascia, allin: p.allin, azione: p.azione,
            inMano: p.inMano, nCarte: p.mano.length, seduto: p.seduto, cambio: p.cambio,
            carte: p.mostra ? p.mano.slice() : null, nomeMano: p.mostra && p.valut ? p.valut.nome : null };
        }) };
    }
    function mandaCarte(soloId) {   // a ognuno le sue carte, a parte
      if (!rete) return;
      M.giocatori.forEach(function (p) {
        if (p.bot || p.id === "host" || p.via || (soloId && p.id !== soloId)) return;
        rete.inviaVeloce({ t: "mie", to: p.id, n: M.n, carte: p.inMano ? p.mano.slice() : [] });
      });
    }
    function mandaOmini() { if (rete) rete.inviaVeloce({ t: "omini", omini: H.omini }); }
    function bd() { var v = vm(); if (rete) rete.invia({ t: "vm", vm: v }); disegna(t, v, cb); }

    // ---- il giro: bot, tempo per decidere, carte che escono da sole, mano finita ----
    function ciclo() {
      ferma();
      if (H.fase !== "gioco") return;
      if (M.stato === "finemano") { salvaMio(true); if (!tMano) tMano = setTimeout(function () { tMano = null; prossimaMano(); }, 4300); return; }
      if (M.stato === "attesa") return;
      if (M.corsa) { tBot = setTimeout(function () { M.corsaPasso(); suono("carta"); bd(); ciclo(); }, 1300); return; }
      if (M.stato === "cambio") {
        var bots = M.giocatori.filter(function (p) { return p.bot && p.inMano && !p.lascia && p.cambio == null; });
        if (bots.length) { tBot = setTimeout(function () { bots.forEach(function (p) { M.cambia(M.giocatori.indexOf(p), cambioBot(p.mano, M.basso)); }); dopoMossa(); }, 900); return; }
        if (online) tTempo = setTimeout(function () { M.giocatori.forEach(function (p, i) { if (p.inMano && !p.lascia && p.cambio == null) M.cambia(i, []); }); mandaCarte(); dopoMossa(); }, T_MOSSA);
        return;
      }
      if (M.turno < 0) return;
      var i = M.turno, p = M.giocatori[i];
      if (p.bot) tBot = setTimeout(function () { var d = decidiBot(M, i, V.liv); M.azione(i, d ? d.tipo : "lascia", d && d.tot); dopoMossa(); }, 700 + Math.random() * 900);
      else if (online) { M.scadenza = Date.now() + T_MOSSA; tTempo = setTimeout(function () { var pos = M.possibili(i); if (pos) M.azione(i, pos.passa ? "passa" : "lascia"); dopoMossa(); }, T_MOSSA); }
    }
    function dopoMossa() { bd(); ciclo(); }
    function prossimaMano() {
      if (H.fase !== "gioco") return;
      M.giocatori.forEach(function (p) {
        if (p.via) return;
        if (p.bot && p.stack <= 0) { p.via = true; if (!online || seduti().length < MAX[M.variante]) aggiungiBot(); }   // un bot nuovo al posto di chi ha finito
        else if (!p.bot && p.stack <= 0) p.seduto = false;                                                          // chi è senza fiches aspetta di rientrare
      });
      if (M.nuovaMano()) { suono("carta"); mandaCarte(); }
      salvaMio(true); bd(); ciclo();
    }

    // ---- le mie mosse (host o chi gioca contro il computer) ----
    var cb = { sonoHost: true, online: online, myId: "host",
      mie: function () { return { n: M.n, carte: io.inMano ? io.mano.slice() : [] }; },
      omini: function () { return H.omini; },
      fuori: function () { return fuori; },
      onAzione: function (tipo, tot) { if (M.azione(M.trova("host"), tipo, tot)) { if (tipo !== "lascia" && tipo !== "passa") suono("fiche"); dopoMossa(); } },
      onCambio: function (quali) { if (M.cambia(M.trova("host"), quali)) { suono("carta"); dopoMossa(); } },
      onRientra: function () {   // si risiede con altre fiches del portafoglio
        var x = Math.min(fuori, BUYIN - io.stack); if (x < GRANDE || io.stack >= GRANDE || (M.inCorso() && io.inMano)) return;
        fuori -= x; io.stack += x; io.buyin += x; io.seduto = true; salvaMio(true);
        if (M.stato === "attesa" && H.fase === "gioco") prossimaMano(); else bd();
      },
      onBonus: function (nuovo) { fuori = Math.max(0, nuovo - io.stack); bd(); },   // ha ritirato il bonus del Black Jack
      onBot: function (piu) {
        if (H.fase !== "lobby") return;
        if (piu && seduti().length < MAX[M.variante]) aggiungiBot();
        else if (!piu) { var ult = seduti().filter(function (p) { return p.bot; }).pop(); if (ult) ult.via = true; }
        bd();
      },
      onComincia: function () {
        if (H.fase !== "lobby" || seduti().length < MIN || seduti().length > MAX[M.variante]) return;
        H.fase = "gioco"; H.classifica = null; mandaOmini(); prossimaMano();
      },
      onFine: function () {   // solo online: chiude la partita e fa la classifica (fiches guadagnate)
        if (!window.confirm("Chiudere il tavolo e vedere la classifica?")) return;
        ferma(); clearTimeout(tMano); tMano = null; M.annulla();
        var umani = M.giocatori.filter(function (p) { return !p.bot; });
        var ord = umani.map(function (p) { return { id: p.id, nome: p.nome, punti: p.stack - p.buyin }; }).sort(function (a, b) { return b.punti - a.punti; });
        ord.forEach(function (r) { r.pos = 1 + ord.filter(function (q) { return q.punti > r.punti; }).length; });
        H.classifica = ord; H.fase = "fine"; salvaMio(true); bd();
        if (t.risultato) t.risultato(ord.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
      },
      onNuova: function () {   // stessa stanza, stessi amici: si torna nella saletta con le fiches che ognuno ha
        M.giocatori = M.giocatori.filter(function (p) { return !p.via; });
        M.giocatori.forEach(function (p) { p.buyin = p.stack; });
        M.dealer = -1; H.fase = "lobby"; H.classifica = null; bd();
      },
      onEsci: function () {
        if (online && H.fase === "gioco" && !window.confirm("Chiudere il tavolo per tutti?")) return;
        if (!online && M.inCorso() && io.inMano && !io.lascia && !window.confirm("Lasciare il tavolo? Le fiches già puntate in questa mano restano sul tavolo.")) return;
        ferma(); clearTimeout(tMano); salvaMio(true);
        if (rete) rete.chiudi();
        t.esci();
      } };

    // "⚙️ Regole" nella saletta: l'host cambia variante e bravura dei bot quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; M.variante = variante(im.variante); V.liv = im.difficolta || V.liv; bd(); };

    if (online) {
      rete = SGNet.ospita(ID, {
        onCodice: function (c) { H.codice = c; bd(); },
        onConnesso: function () { H.pronta = true; bd(); },
        onAddio: function (id) {
          var i = M.trova(id); if (i < 0) return;
          if (H.fase === "lobby") { M.giocatori.splice(i, 1); if (M.dealer >= M.giocatori.length) M.dealer = -1; bd(); return; }
          M.esce(i); dopoMossa();
        },
        onMsg: function (id, m) {
          if (!m || !m.t) return;
          var i = M.trova(id), p = i >= 0 ? M.giocatori[i] : null;
          if (m.t === "join") {
            if (p) { p.via = false; if (H.fase === "lobby") p.seduto = p.stack > 0; }   // si era perso per un attimo: resta al suo posto
            else if (H.fase !== "fine" && seduti().length < MAX[M.variante]) {
              var nomeG = String(m.nome || "Amico").slice(0, 16), st = Math.max(0, Math.min(BUYIN, Math.floor(+m.fiches || 0)));
              p = M.siedi({ id: id, nome: nomeG, omino: avatarValido(m.omino), stack: st });
              H.omini[id] = p.omino;
            }
            mandaOmini();
            if (p && H.fase === "gioco" && M.stato === "attesa") prossimaMano(); else bd();
            if (p) mandaCarte(id);
            return;
          }
          if (!p) return;
          if (m.t === "azione" && H.fase === "gioco") { if (M.azione(i, m.tipo, m.tot)) { if (m.tipo !== "lascia" && m.tipo !== "passa") suono("fiche"); dopoMossa(); } }
          else if (m.t === "cambio" && H.fase === "gioco") { if (M.cambia(i, m.quali)) { mandaCarte(id); dopoMossa(); } }
          else if (m.t === "rientra") {   // si risiede con altre fiches (finite quelle di prima, o in saletta)
            if (p.stack >= GRANDE || (M.inCorso() && p.inMano)) return;
            var x = Math.max(0, Math.min(BUYIN, Math.floor(+m.fiches || 0)));
            if (!x) return;
            p.stack += x; p.buyin += x; p.seduto = true;
            if (H.fase === "gioco" && M.stato === "attesa") prossimaMano(); else bd();
          }
        },
        onErrore: function () { senzaRete(t); }
      });
      bd();
    } else {
      var nBot = Math.max(1, Math.min(MAX[M.variante] - 1, Math.floor(+imp.avversari || 3)));
      for (var b = 0; b < nBot; b++) aggiungiBot();
      prossimaMano();
    }
  }

  // =========================================================
  //  OSPITE ONLINE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var prof = conProfilo();
    var S = { rete: null, myId: null, nome: "", vm: null, mie: null, omini: {}, fuori: 0, tSalva: null, salvato: null };
    var W = prof ? portafoglio() : BUYIN, buyin = Math.min(W, BUYIN);
    S.fuori = W - buyin;
    function me() { if (!S.vm) return null; for (var i = 0; i < S.vm.players.length; i++) if (S.vm.players[i].id === S.myId) return S.vm.players[i]; return null; }
    function salva(subito) {   // nel profilo: fiches fuori + fiches sul tavolo (solo quando sono seduto)
      var m = me(); if (!prof || !m) return;
      clearTimeout(S.tSalva);
      var fai = function () { var tot = S.fuori + m.stack; if (tot !== S.salvato) { S.salvato = tot; SGNube.salvaFiches("blackjack", tot); } };
      if (subito) fai(); else S.tSalva = setTimeout(fai, 1500);
    }
    var cb = { sonoHost: false, online: true, myId: null,
      mie: function () { return S.mie && S.vm && S.mie.n === S.vm.n ? S.mie : null; },
      omini: function () { return S.omini; },
      fuori: function () { return S.fuori; },
      onAzione: function (tipo, tot) { if (S.rete) S.rete.invia({ t: "azione", tipo: tipo, tot: tot }); },
      onCambio: function (quali) { if (S.rete) S.rete.invia({ t: "cambio", quali: quali }); },
      onRientra: function () {
        var m = me(), x = Math.min(S.fuori, BUYIN - (m ? m.stack : 0)); if (x < GRANDE || !S.rete) return;
        S.fuori -= x; S.rete.invia({ t: "rientra", fiches: x });
      },
      onBonus: function (nuovo) { var m = me(); S.fuori = Math.max(0, nuovo - (m ? m.stack : 0)); if (S.vm) disegna(t, S.vm, cb); },
      onEsci: function () {
        if (S.vm && S.vm.fase === "gioco" && !window.confirm("Lasciare il tavolo? Le fiches già puntate in questa mano restano sul tavolo.")) return;
        salva(true); if (S.rete) S.rete.chiudi(); t.esci();
      } };
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra al tavolo", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null, fiches: buyin }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;   // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; salva(); disegna(t, m.vm, cb); }
          else if (m.t === "mie") { S.mie = { n: m.n, carte: m.carte || [] }; if (S.vm) disegna(t, S.vm, cb); }
          else if (m.t === "omini") { S.omini = m.omini || {}; if (S.vm) disegna(t, S.vm, cb); }
        },
        onChiuso: function () { salva(true); errore(t, "Il tavolo è stato chiuso dall'host."); },
        onErrore: function () { errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function attesa() {
      var s = t.schermata({ icona: "🃏", titolo: "Mi siedo al tavolo…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO (uguale per tutti): saletta, tavolo, classifica
  // =========================================================
  var UI = null;   // la schermata del tavolo si costruisce UNA volta e poi si aggiorna a pezzi
  function disegna(t, vm, cb) {
    if (vm.fase === "lobby") { UI = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") { UI = null; return finale(t, vm, cb); }
    if (!UI || !document.body.contains(UI.s)) UI = creaSchermo(t, cb);
    UI.cb = cb;
    aggiorna(UI, vm);
  }
  function faccia(cb, p) {
    var cfg = (cb.omini() || {})[p.id] || (window.SGOmino ? SGOmino.casuale(p.nome) : null);
    return cfg && window.SGOmino ? SGOmino.svg(cfg, { busto: true }) : "<div style='font-size:1.6rem;line-height:46px'>🙂</div>";
  }
  function lobby(t, vm, cb) {
    var el = t.el, extra = [], umani = vm.players.filter(function (p) { return !p.bot; }).length;
    extra.push(el("p", { class: "modulo-nota", text: NOME_VAR[vm.variante] + " · da 2 a " + MAX[vm.variante] + " giocatori. Ognuno si siede con le sue fiches del Black Jack (al massimo " + fmtN(BUYIN) + ")." }));
    if (vm.players.length > MAX[vm.variante]) extra.push(el("p", { class: "modulo-nota", style: "color:#ffa94d", text: "Siete troppi per questa variante: togli qualche bot." }));
    if (cb.sonoHost) {
      var nb = vm.players.length - umani;
      extra.push(el("div", { class: "pk-bot-riga" }, [
        el("span", { text: "🤖 Bot al tavolo: " + nb }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "−", disabled: nb ? null : "disabled", onclick: function () { cb.onBot(false); } }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "+", disabled: vm.players.length < MAX[vm.variante] ? null : "disabled", onclick: function () { cb.onBot(true); } }) ]));
    }
    var io = null; vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    if (io) extra.push(fichesBox(t, cb, io));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN, puoiDaSolo: vm.players.length >= MIN,
      puoComincia: vm.players.length >= MIN && vm.players.length <= MAX[vm.variante],
      vuoti: Math.max(0, MIN - vm.players.length),
      giocatori: vm.players.map(function (p) {
        return { id: p.id, nome: p.nome, omino: (cb.omini() || {})[p.id] || (p.bot && window.SGOmino ? SGOmino.casuale(p.nome) : null), host: p.id === "host", tu: p.id === cb.myId, bot: p.bot };
      }),
      extra: extra, attesa: "Aspetta che l'host cominci: si gioca a " + NOME_VAR[vm.variante] + "! 🃏", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  // le mie fiches (e, se sono finite, il modo per risedersi o il bonus del Black Jack)
  function fichesBox(t, cb, io) {
    var el = t.el, box = el("div", { class: "pk-fiches" });
    if (io.stack >= GRANDE) { box.appendChild(el("div", { text: "🎰 Ti siedi con " + fmtN(io.stack) + " fiches" })); return box; }
    var x = Math.min(cb.fuori(), BUYIN - io.stack);
    if (x >= GRANDE) box.appendChild(el("button", { class: "btn btn-primario", text: "🎰 Siediti con " + fmtN(x) + " fiches", onclick: cb.onRientra }));
    else {
      box.appendChild(el("div", { text: "Non hai più fiches da mettere sul tavolo." }));
      if (conProfilo() && BJ() && BJ().riquadroBonus) box.appendChild(BJ().riquadroBonus(el, function (nuovo) { cb.onBonus(nuovo); }));
    }
    return box;
  }
  function creaSchermo(t, cb) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("pk-piena");
    var ui = { t: t, s: s, el: el, cb: cb, posti: {}, chiaveTav: "", chiaveMie: "", chiaveAz: "", sel: {}, rialzo: null, nSel: -1 };
    ui.info = el("div", { class: "pk-info" });
    var barra = el("div", { class: "pk-barra" }, [ el("button", { class: "pk-tastino", text: "‹", "aria-label": "Esci", onclick: function () { ui.cb.onEsci(); } }), ui.info,
      cb.sonoHost && cb.online ? el("button", { class: "pk-tastino", text: "🏁", "aria-label": "Fine partita", onclick: function () { ui.cb.onFine(); } }) : null ]);
    ui.tavolo = el("div", { class: "pk-tavolo" }, [ el("div", { class: "pk-feltro" }) ]);
    ui.comuni = el("div", { class: "pk-comuni" });
    ui.piatto = el("div", { class: "pk-piatto" });
    ui.msg = el("div", { class: "pk-msg" });
    ui.tavolo.appendChild(el("div", { class: "pk-centro" }, [ ui.comuni, ui.piatto, ui.msg ]));
    ui.mioInfo = el("div", { class: "pk-mio-info" });
    ui.mie = el("div", { class: "pk-mie" });
    ui.azioni = el("div", { class: "pk-azioni" });
    s._contenuto.appendChild(el("div", { class: "pk-scena" }, [ barra, ui.tavolo, el("div", { class: "pk-io" }, [ ui.mioInfo, ui.mie, ui.azioni ]) ]));
    t.mostra(s);
    return ui;
  }
  function cartaPiccola(el, c) {   // carta semplice e leggibile anche piccola
    return el("div", { class: "pk-cs" + (ROSSO[c.s] ? " rossa" : "") }, [ el("b", { text: FIGURE[c.v] || String(c.v) }), el("i", { text: SEMI[c.s] }) ]);
  }
  function cartaGrande(el, c) {   // le mie carte: quelle disegnate del Black Jack
    var b = BJ();
    if (b && b.cartaHTML) return el("div", { class: "pk-carta", html: b.cartaHTML(c, false) });
    var d = cartaPiccola(el, c); d.classList.add("grande"); return d;
  }
  function aggiorna(ui, vm) {
    ui.vm = vm;
    var cb = ui.cb, el = ui.el, io = null;
    vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    ui.info.textContent = NOME_VAR[vm.variante] + (vm.variante === "he" ? " · bui " + PICCOLO + "/" + GRANDE : " · invito " + INVITO) + (vm.n ? " · mano " + vm.n : "");

    // ---- gli altri, ad arco intorno al tavolo (io sono in basso: le mie cose stanno sotto) ----
    var k0 = 0; vm.players.forEach(function (p, k) { if (p.id === cb.myId) k0 = k; });
    var altri = vm.players.slice(k0 + 1).concat(vm.players.slice(0, k0)).filter(function (p) { return p.id !== cb.myId; });
    var visti = {};
    altri.forEach(function (p, k) {
      var ang = altri.length === 1 ? 270 : 165 + k * (210 / (altri.length - 1)), a = ang * Math.PI / 180;
      var P = ui.posti[p.id];
      if (!P) { P = ui.posti[p.id] = creaPosto(ui, p); ui.tavolo.appendChild(P.nodo); }
      P.nodo.style.left = (50 + 39 * Math.cos(a)).toFixed(1) + "%";
      P.nodo.style.top = (50 + 35 * Math.sin(a)).toFixed(1) + "%";
      aggiornaPosto(ui, P, p, vm);
      visti[p.id] = 1;
    });
    Object.keys(ui.posti).forEach(function (id) { if (!visti[id]) { var nd = ui.posti[id].nodo; if (nd.parentNode) nd.parentNode.removeChild(nd); delete ui.posti[id]; } });

    // ---- centro: carte comuni (Hold'em), piatto, cosa succede ----
    var kt = vm.variante + JSON.stringify(vm.tavolo);
    if (kt !== ui.chiaveTav) {
      ui.chiaveTav = kt; svuota(ui.comuni);
      if (vm.variante === "he") for (var c = 0; c < 5; c++) ui.comuni.appendChild(vm.tavolo[c] ? cartaPiccola(el, vm.tavolo[c]) : el("div", { class: "pk-slot" }));
    }
    ui.piatto.textContent = vm.piatto > 0 ? "Piatto " + fmtN(vm.piatto) : "";
    ui.msg.textContent = messaggio(vm, cb);

    // ---- le mie carte ----
    var mie = cb.mie(), inCambio = vm.stato === "cambio" && io && io.inMano && !io.lascia && io.cambio == null;
    if (ui.nSel !== vm.n || !inCambio) { if (ui.nSel !== vm.n) ui.rialzo = null; ui.sel = {}; ui.nSel = vm.n; }
    var km = mie ? vm.n + JSON.stringify(mie.carte) + (inCambio ? "c" + Object.keys(ui.sel).join(",") : "") + (io && io.lascia ? "L" : "") : "";
    if (km !== ui.chiaveMie) {
      ui.chiaveMie = km; svuota(ui.mie);
      ui.mie.classList.toggle("cinque", !!(mie && mie.carte.length > 2));
      ui.mie.classList.toggle("lascia", !!(io && io.lascia));
      if (mie) mie.carte.forEach(function (cc, k) {
        var d = cartaGrande(el, cc);
        if (inCambio) {
          d.classList.add("tocca"); if (ui.sel[k]) d.classList.add("via");
          d.addEventListener("click", function () {
            if (ui.sel[k]) delete ui.sel[k]; else if (Object.keys(ui.sel).length < 4) ui.sel[k] = 1;
            aggiorna(ui, ui.vm);
          });
        }
        ui.mie.appendChild(d);
      });
    }
    // la mia riga: fiches, puntata, che mano ho
    var testo = "Tu · " + (io ? fmtN(io.stack) : "0") + " fiches";
    if (io && io.inGiro > 0) testo += " · puntata " + fmtN(io.inGiro);
    if (vm.dealer === cb.myId) testo += " · Ⓓ";
    var nomeMano = "";
    if (mie && mie.carte.length && io && io.inMano && !io.lascia) nomeMano = miglioreMano(vm.variante === "he" ? mie.carte.concat(vm.tavolo) : mie.carte, vm.variante, vm.variante === "it" ? bassoIt(vm.players.filter(function (p) { return p.inMano; }).length) : 2).nome;
    if (vm.vinti && vm.vinti[cb.myId]) nomeMano = "+" + fmtN(vm.vinti[cb.myId]) + " 🎉";
    ui.mioInfo.innerHTML = "";
    ui.mioInfo.appendChild(el("span", { text: testo }));
    ui.mioInfo.appendChild(el("span", { class: "pk-mano-nome", text: nomeMano }));

    disegnaAzioni(ui, vm, io);
  }
  function creaPosto(ui, p) {
    var el = ui.el, P = {};
    P.av = el("div", { class: "pk-av", html: faccia(ui.cb, p) });
    P.d = el("span", { class: "pk-d", text: "D" });
    P.carte = el("div", { class: "pk-dorsi" });
    P.nome = el("div", { class: "pk-nome", text: p.nome });
    P.stack = el("div", { class: "pk-stack" });
    P.az = el("div", { class: "pk-az" });
    P.nodo = el("div", { class: "pk-posto" }, [ el("div", { class: "pk-av-box" }, [ P.av, P.d ]), P.carte, P.nome, P.stack, P.az ]);
    return P;
  }
  function aggiornaPosto(ui, P, p, vm) {
    var vinto = vm.vinti && vm.vinti[p.id];
    P.nodo.classList.toggle("turno", vm.turno === p.id);
    P.nodo.classList.toggle("fuori", !!(p.lascia || !p.inMano));
    P.nodo.classList.toggle("vince", !!vinto);
    P.d.style.display = vm.dealer === p.id ? "" : "none";
    P.stack.textContent = p.seduto === false && !p.stack ? "senza fiches" : fmtN(p.stack);
    var az = "", cls = "pk-az";
    if (vinto) { az = "+" + fmtN(vinto); cls += " vinto"; }
    else if (p.carte && p.nomeMano) az = p.nomeMano;
    else if (vm.turno === p.id) az = "🤔";
    else if (p.inGiro > 0) { az = fmtN(p.inGiro); cls += " punta"; }
    else az = p.azione || "";
    P.az.textContent = az; P.az.className = cls;
    // le carte: coperte durante la mano, scoperte alla fine (scritte, così si leggono)
    var kc = p.carte ? p.carte.map(testoCarta).join(" ") : (p.inMano && !p.lascia ? "x" + Math.min(p.nCarte, 5) : "");
    if (P.kc !== kc) {
      P.kc = kc; svuota(P.carte); P.carte.className = "pk-dorsi" + (p.carte ? " scoperte" : "");
      if (p.carte) p.carte.forEach(function (c) { P.carte.appendChild(ui.el("span", { class: "pk-cartina" + (ROSSO[c.s] ? " rossa" : ""), text: testoCarta(c) })); });
      else if (p.inMano && !p.lascia) for (var k = 0; k < Math.min(p.nCarte, 5); k++) P.carte.appendChild(ui.el("span", { class: "pk-dorso" }));
    }
  }
  function nomeDi(vm, cb, id) { if (id === cb.myId) return "Tu"; for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return vm.players[i].nome; return "?"; }
  function messaggio(vm, cb) {
    if (vm.stato === "attesa") return vm.players.filter(function (p) { return p.stack > 0 && p.seduto !== false; }).length < MIN ? "Aspettiamo altri giocatori con le fiches…" : "";
    if (vm.stato === "cambio") return "🔄 Cambio delle carte…";
    if (vm.stato === "finemano" && vm.vinti) {
      var ids = Object.keys(vm.vinti); if (!ids.length) return "";
      var chi = ids.map(function (id) { return nomeDi(vm, cb, id); });
      var mano = ""; vm.players.forEach(function (p) { if (p.id === ids[0] && p.nomeMano) mano = p.nomeMano; });
      if (ids.length === 1) return (chi[0] === "Tu" ? "Hai vinto " : chi[0] + " vince ") + fmtN(vm.vinti[ids[0]]) + (mano ? " con " + mano : "");
      return "Piatto diviso: " + chi.join(", ");
    }
    return "";
  }
  function mossePer(vm, io) {   // le stesse regole del motore, viste dal mio telefono
    var serve = Math.max(0, vm.daChiamare - io.inGiro), tutto = io.inGiro + io.stack;
    return { passa: serve === 0, chiama: serve > 0 ? Math.min(serve, io.stack) : 0,
      punta: tutto > vm.daChiamare ? { min: Math.min(vm.daChiamare + vm.rilMin, tutto), max: tutto } : null };
  }
  function disegnaAzioni(ui, vm, io) {
    var cb = ui.cb, el = ui.el;
    var mioTurno = io && vm.turno === io.id && PUNTATE[vm.stato];
    var inCambio = vm.stato === "cambio" && io && io.inMano && !io.lascia && io.cambio == null;
    var chiave = [vm.stato, vm.turno, vm.daChiamare, vm.rilMin, vm.n, io ? [io.inGiro, io.stack, io.seduto, io.lascia, io.cambio, io.inMano].join("/") : "-",
      ui.rialzo ? "R" : "", inCambio ? Object.keys(ui.sel).length : "", cb.fuori()].join("|");
    if (chiave === ui.chiaveAz) return;
    ui.chiaveAz = chiave; svuota(ui.azioni);
    function stato(txt) { ui.azioni.appendChild(el("div", { class: "pk-stato", text: txt })); }
    function bottone(cls, txt, fn) { return el("button", { class: "pk-btn " + cls, text: txt, onclick: fn }); }
    if (!io) return stato("Stai guardando il tavolo");
    if (!io.inMano && io.stack < GRANDE && vm.stato !== "finemano") {   // fiches finite: ci si risiede col portafoglio o col bonus
      stato("Hai finito le fiches sul tavolo.");
      ui.azioni.appendChild(fichesBox(ui.t, cb, io));
      return;
    }
    if (inCambio) {
      var n = Object.keys(ui.sel).length;
      stato(n ? "Cambi " + n + (n === 1 ? " carta" : " carte") + " (massimo 4)" : "Tocca le carte da cambiare (massimo 4)");
      ui.azioni.appendChild(el("div", { class: "pk-riga" }, [
        bottone("passa", "✋ Servito", function () { cb.onCambio([]); }),
        bottone("ok", n ? "🔄 Cambia " + n : "🔄 Cambia", function () { if (n) cb.onCambio(Object.keys(ui.sel).map(Number)); }) ]));
      return;
    }
    if (!mioTurno) {
      ui.rialzo = null;
      if (vm.stato === "finemano") return stato("Prossima mano tra poco…");
      if (vm.stato === "attesa") return stato(messaggio(vm, cb) || "Si comincia…");
      if (vm.stato === "cambio") return stato("Aspetta che gli altri cambino le carte…");
      if (io.lascia) return stato("Hai lasciato: aspetta la prossima mano");
      if (!io.inMano) return stato("Entri alla prossima mano");
      if (io.allin) return stato("Sei all-in: vediamo come va…");
      return stato(vm.turno ? "Tocca a " + nomeDi(vm, cb, vm.turno) + "…" : "…");
    }
    var pos = mossePer(vm, io);
    if (ui.rialzo && pos.punta) return pannelloRialzo(ui, vm, pos);
    ui.rialzo = null;
    var riga = el("div", { class: "pk-riga" });
    riga.appendChild(bottone("lascia", "Lascia", function () { cb.onAzione("lascia"); }));
    if (pos.passa) riga.appendChild(bottone("passa", "Passa", function () { cb.onAzione("passa"); }));
    else riga.appendChild(bottone("passa", (pos.chiama >= io.stack ? "All-in " : "Chiama ") + fmtN(pos.chiama), function () { cb.onAzione("chiama"); }));
    if (pos.punta) {
      if (pos.punta.min >= pos.punta.max) riga.appendChild(bottone("punta", "All-in " + fmtN(pos.punta.max - io.inGiro), function () { cb.onAzione("punta", pos.punta.max); }));
      else riga.appendChild(bottone("punta", vm.daChiamare ? "Rilancia…" : "Punta…", function () { ui.rialzo = { tot: pos.punta.min }; ui.chiaveAz = ""; aggiorna(ui, ui.vm); }));
    }
    ui.azioni.appendChild(riga);
  }
  function pannelloRialzo(ui, vm, pos) {
    var el = ui.el, cb = ui.cb, R = ui.rialzo, min = pos.punta.min, max = pos.punta.max, passo = 10;
    R.tot = Math.max(min, Math.min(max, R.tot));
    var etichetta = el("div", { class: "pk-stato pk-rialzo-tot" });
    var ok = el("button", { class: "pk-btn ok" });
    function mostra() {
      etichetta.textContent = (vm.daChiamare ? "Rilanci a " : "Punti ") + fmtN(R.tot) + (R.tot >= max ? " (all-in)" : "");
      ok.textContent = "✓ " + (R.tot >= max ? "All-in" : (vm.daChiamare ? "Rilancia" : "Punta"));
      cursore.value = String(R.tot);
    }
    var cursore = el("input", { type: "range", class: "pk-slider", min: String(min), max: String(max), step: String(passo), value: String(R.tot) });
    cursore.addEventListener("input", function () { R.tot = Math.max(min, Math.min(max, +cursore.value)); if (max - R.tot < passo) R.tot = max; mostra(); });
    var piatto = vm.piatto;
    function scelta(txt, val) { return el("button", { class: "pk-btn piccolo", text: txt, onclick: function () { R.tot = Math.max(min, Math.min(max, Math.round(val / passo) * passo)); mostra(); } }); }
    ok.addEventListener("click", function () { ui.rialzo = null; cb.onAzione("punta", R.tot); });
    ui.azioni.appendChild(etichetta);
    ui.azioni.appendChild(cursore);
    ui.azioni.appendChild(el("div", { class: "pk-riga" }, [ scelta("Minimo", min), scelta("½ piatto", vm.daChiamare + piatto / 2), scelta("Piatto", vm.daChiamare + piatto), scelta("All-in", max) ]));
    ui.azioni.appendChild(el("div", { class: "pk-riga" }, [ el("button", { class: "pk-btn lascia", text: "Annulla", onclick: function () { ui.rialzo = null; ui.chiaveAz = ""; aggiorna(ui, ui.vm); } }), ok ]));
    mostra();
  }
  function finale(t, vm, cb) {
    var s = t.schermata({ icona: "🏆", titolo: "Classifica del tavolo", sotto: "Fiches guadagnate o perse" });
    var ol = t.el("ol", { class: "classifica" }), med = ["🥇", "🥈", "🥉"];
    (vm.classifica || []).forEach(function (r) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: med[r.pos - 1] || (r.pos + "°") }),
        t.el("span", { class: "nome", text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }),
        t.el("span", { class: "punti", text: (r.punti > 0 ? "+" : "") + fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    t.mostra(s);
  }
  function senzaFiches(t, riprova) {
    var s = t.schermata({ icona: "🎰", titolo: "Ti servono delle fiches", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Il Poker si gioca con le fiches del Black Jack e adesso non ne hai. Ritira il bonus gratis, poi siediti al tavolo." }));
    if (BJ() && BJ().riquadroBonus) s._contenuto.appendChild(BJ().riquadroBonus(t.el, function () {}));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🃏 Siediti al tavolo", onclick: riprova }));
    t.mostra(s);
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Il poker online funziona quando l'app è aperta dal sito pubblicato. Intanto puoi giocare contro il computer." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.pk-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#0b1912}",
      ".schermata.pk-piena>.testa,.schermata.pk-piena>.piede{display:none}",
      ".schermata.pk-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".pk-scena{height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;padding:calc(6px + env(safe-area-inset-top)) 8px calc(8px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none;color:#fff;background:radial-gradient(120% 80% at 50% 40%,#1d3b2c,#0b1912)}",
      ".pk-barra{display:flex;align-items:center;gap:8px;min-height:36px;flex:none}",
      ".pk-tastino{width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.1rem;font-weight:900;cursor:pointer;flex:none}",
      ".pk-info{flex:1;min-width:0;font-size:.78rem;font-weight:800;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".pk-tavolo{position:relative;flex:1 1 auto;min-height:0}",
      ".pk-feltro{position:absolute;left:3%;right:3%;top:5%;bottom:5%;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#2e8b57,#1b5e3a 70%,#14472c);box-shadow:inset 0 0 0 6px #6b3e1f,inset 0 0 0 9px #3d220f,0 10px 24px rgba(0,0,0,.5)}",
      ".pk-centro{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:52%;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center}",
      ".pk-comuni{display:flex;gap:3px;justify-content:center}",
      ".pk-cs{width:34px;height:48px;flex:none;border-radius:5px;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;box-shadow:0 2px 4px rgba(0,0,0,.4);animation:pkArriva .25s ease-out}",
      ".pk-cs b{font-size:1rem;font-weight:900}.pk-cs i{font-style:normal;font-size:1.05rem}.pk-cs.rossa{color:#d21c24}",
      ".pk-cs.grande{width:64px;height:90px}.pk-cs.grande b{font-size:1.7rem}.pk-cs.grande i{font-size:1.8rem}",
      "@keyframes pkArriva{from{opacity:0;transform:translateY(-8px) scale(.9)}to{opacity:1;transform:none}}",
      ".pk-slot{width:34px;height:48px;flex:none;border-radius:5px;border:1.5px dashed rgba(255,255,255,.2)}",
      ".pk-piatto{font-weight:900;font-size:.95rem;color:#ffe066;min-height:1.2em}",
      ".pk-msg{font-size:.78rem;font-weight:800;min-height:1.1em;line-height:1.25}",
      ".pk-posto{position:absolute;transform:translate(-50%,-50%);width:76px;display:flex;flex-direction:column;align-items:center;text-align:center;transition:opacity .2s}",
      ".pk-av-box{position:relative;width:44px;height:44px}",
      ".pk-av{width:44px;height:44px;border-radius:50%;overflow:hidden;background:#24443a;box-shadow:0 0 0 2px rgba(255,255,255,.25)}",
      ".pk-av svg{width:100%;height:100%;display:block}",
      ".pk-posto.turno .pk-av{box-shadow:0 0 0 3px #ffe066,0 0 14px #ffe066}",
      ".pk-posto.fuori{opacity:.45}.pk-posto.vince{opacity:1}",
      ".pk-posto.vince .pk-av{box-shadow:0 0 0 3px #69db7c,0 0 14px #69db7c}",
      ".pk-d{position:absolute;left:-6px;top:-4px;width:18px;height:18px;border-radius:50%;background:#fff;color:#111;font-size:.62rem;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.5)}",
      ".pk-dorsi{display:flex;justify-content:center;min-height:10px;margin-top:-8px;position:relative}",
      ".pk-dorso{width:12px;height:17px;border-radius:2px;background:linear-gradient(135deg,#c92a2a,#7a1414);border:1px solid #fff;margin-left:-5px;box-shadow:0 1px 2px rgba(0,0,0,.4)}",
      ".pk-dorsi.scoperte{flex-wrap:wrap;gap:2px;margin-top:2px}",
      ".pk-cartina{background:#fff;color:#111;border-radius:3px;padding:0 2px;font-size:.66rem;font-weight:900;line-height:1.3}.pk-cartina.rossa{color:#d21c24}",
      ".pk-nome{font-size:.68rem;font-weight:800;max-width:76px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}",
      ".pk-stack{font-size:.66rem;font-weight:800;color:#ffe066}",
      ".pk-az{font-size:.64rem;font-weight:800;min-height:1.1em;white-space:nowrap}.pk-az.punta{color:#ffd8a8}.pk-az.punta:before{content:\"\";display:inline-block;width:8px;height:8px;border-radius:50%;background:#e67700;border:2px dotted #fff;margin-right:3px;vertical-align:-1px}.pk-az.vinto{color:#69db7c;font-size:.76rem}",
      ".pk-io{flex:none;display:flex;flex-direction:column;gap:6px;padding-top:4px}",
      ".pk-mio-info{display:flex;justify-content:space-between;align-items:center;font-size:.8rem;font-weight:800;gap:8px;min-height:1.2em}",
      ".pk-mano-nome{color:#69db7c}",
      ".pk-mie{display:flex;justify-content:center;gap:6px;min-height:90px;align-items:flex-end}",
      ".pk-mie.lascia{opacity:.4}",
      ".pk-carta{width:64px;flex:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));transition:transform .15s,opacity .15s}",
      ".pk-carta svg{display:block;width:100%;height:auto}",
      ".pk-mie.cinque .pk-carta,.pk-mie.cinque .pk-cs.grande{width:58px}",
      ".pk-mie .tocca{cursor:pointer}.pk-mie .via{transform:translateY(-12px);opacity:.5}",
      ".pk-azioni{display:flex;flex-direction:column;gap:6px;min-height:52px;justify-content:flex-end}",
      ".pk-riga{display:flex;gap:6px}",
      ".pk-btn{flex:1;min-height:46px;border:0;border-radius:14px;font:inherit;font-weight:900;font-size:.95rem;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
      ".pk-btn.lascia{background:#495057}.pk-btn.passa{background:#1c7ed6}.pk-btn.punta{background:#e67700}.pk-btn.ok{background:#2f9e44}",
      ".pk-btn.piccolo{min-height:34px;font-size:.78rem;background:rgba(255,255,255,.14)}",
      ".pk-slider{width:100%;accent-color:#e67700;margin:0}",
      ".pk-stato{text-align:center;font-size:.9rem;font-weight:800;opacity:.85;padding:6px 0}",
      ".pk-rialzo-tot{opacity:1;color:#ffd8a8;padding:0}",
      ".pk-fiches{display:flex;flex-direction:column;gap:8px;align-items:stretch;text-align:center;font-weight:800}",
      ".pk-bot-riga{display:flex;align-items:center;gap:8px;justify-content:center;font-weight:800}"
    ].join("");
    document.head.appendChild(st);
  }
  function variante(v) { return v === "it" ? "it" : "he"; }

  SG.registra({
    id: ID, nome: "Poker", icona: "♠️",
    descrizione: "Texas Hold'em o Poker all'italiana con le carte francesi, contro il computer o online. Si gioca con le fiches del Black Jack.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 3, etichettaGiocatori: "👥 2–10 giocatori",
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Tu e i bot al tavolo (il primo è Matt)" }],
    regole: [
      "<b>Texas Hold'em</b>: hai 2 carte tue e ne escono 5 in mezzo per tutti (3, poi 1, poi 1). Vince la migliore combinazione di 5 carte.",
      "Prima di ogni mano due giocatori mettono i <b>bui</b> (" + PICCOLO + " e " + GRANDE + "). Quando tocca a te: <b>Passa</b>, <b>Chiama</b>, <b>Punta/Rilancia</b> o <b>Lascia</b>.",
      "<b>Poker all'italiana</b>: tutti mettono l'invito (" + INVITO + "), hai 5 carte, si punta, poi ognuno <b>cambia</b> fino a 4 carte e si punta di nuovo. Il mazzo è corto (in 4 si gioca dal 7 in su), il <b>colore batte il full</b> e a parità decide il seme: cuori, quadri, fiori, picche.",
      "Dalla più bassa: carta alta, coppia, doppia coppia, tris, scala, colore, full, poker, scala colore (all'italiana colore e full si scambiano).",
      "Si gioca con le <b>fiches del Black Jack</b>: ti siedi con al massimo " + fmtN(BUYIN) + " e quello che vinci o perdi resta nel tuo profilo."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.variante = "he"; dove.avversari = 3; dove.difficolta = "medio";
      box.appendChild(el("div", { class: "etichetta", text: "Che poker?" }));
      var bHe, bIt;
      function selV(v) {
        dove.variante = v; dove.avversari = Math.min(dove.avversari, MAX[v] - 1);
        bHe.className = "modo-chip" + (v === "he" ? " attiva" : ""); bIt.className = "modo-chip" + (v === "it" ? " attiva" : "");
        if (contaAvv) contaAvv.textContent = dove.avversari;
      }
      bHe = el("button", { class: "modo-chip attiva", onclick: function () { selV("he"); } }, [ el("span", { class: "mi", text: "🤠" }), el("div", {}, [ el("div", { class: "mt", text: "Texas Hold'em" }), el("div", { class: "ms", text: "2 carte tue + 5 in mezzo" }) ]) ]);
      bIt = el("button", { class: "modo-chip", onclick: function () { selV("it"); } }, [ el("span", { class: "mi", text: "🇮🇹" }), el("div", {}, [ el("div", { class: "mt", text: "All'italiana" }), el("div", { class: "ms", text: "5 carte, poi le cambi" }) ]) ]);
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bHe, bIt]));
      var contaAvv = null;
      if (aiuti.modo !== "online") {   // contro il computer: quanti bot al tavolo
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Quanti avversari" }));
        contaAvv = el("b", { text: String(dove.avversari), style: "min-width:2em;text-align:center;font-size:1.2rem" });
        box.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px" }, [
          el("button", { class: "modo-chip", style: "flex:1;justify-content:center", onclick: function () { dove.avversari = Math.max(1, dove.avversari - 1); contaAvv.textContent = dove.avversari; } }, [ el("div", { class: "mt", text: "−" }) ]),
          contaAvv,
          el("button", { class: "modo-chip", style: "flex:1;justify-content:center", onclick: function () { dove.avversari = Math.min(MAX[dove.variante] - 1, dove.avversari + 1); contaAvv.textContent = dove.avversari; } }, [ el("div", { class: "mt", text: "+" }) ]) ]));
      }
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei bot" }));
      var dg = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [ el("div", { class: "mt", text: d[1] }) ]);
        b.style.flex = "1"; dg.appendChild(b);
      });
      box.appendChild(dg);
      if (conProfilo() && BJ() && BJ().riquadroBonus) { var f = BJ().riquadroBonus(el); f.style.marginTop = "12px"; box.appendChild(f); }
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:8px", text: "Si gioca con le fiches del Black Jack: ti siedi con al massimo " + fmtN(BUYIN) + " e quello che vinci o perdi resta nel profilo." }));
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return partita(t, (t.impostazioni || {}).modo === "online");
    }
  });

  // per le prove (motore e punti), senza toccare la partita
  window.__POKER = { creaMotore: creaMotore, valuta5: valuta5, miglioreMano: miglioreMano, confronta: confronta, equita: equita, cambioBot: cambioBot, decidiBot: decidiBot };
})();
