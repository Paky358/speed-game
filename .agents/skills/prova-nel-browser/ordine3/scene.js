// PAROLA D'ORDINE, giro 3 (20 nov 2026, chat «Parola d'ordine clamorosa»): le scene per le foto (saletta e partita con la chat).
// Uso (dopo copione-prova.js): await COPIONE.carica("ordine3/scene.js"); await O3.saletta(); … await O3.partita()
// Lo strumento delle foto (foto.js qui accanto) le chiama e fotografa ogni telefono. Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no;
  var INDIZI = ["QUOKKA", "ZEFIRO", "GNOMO", "YETI", "FIORDO", "WAFER", "OBLO", "JAZZ", "ZUAVO", "KIWI", "PUFFO", "VICHINGO", "BRADIPO", "KOALA"];
  function chiDi(C, nome) { return ((vm(C).players || []).filter(function (p) { return p.nome === nome; }))[0] || null; }
  function idDi(C, nome) { var p = chiDi(C, nome); return p ? p.id : null; }
  function nomeDi(C, id) { var p = ((vm(C).players || []).filter(function (x) { return x.id === id; }))[0]; return p ? p.nome : null; }
  function carte(w) { return w ? w.document.querySelectorAll(".or-tab .or-carta") : []; }
  function chiaveDa(w) { return [].map.call(carte(w), function (b) { var m = / c(\d|n|x)(\s|$)/.exec(" " + b.className + " "); return m ? (/\d/.test(m[1]) ? +m[1] : m[1]) : null; }); }
  function manda(nome, m) {
    var w = W.finestra(nome), u = w && w.__ORDINE && w.__ORDINE.ui;
    if (u && u.cb && u.cb.sonoHost) { u.cb.manda(m); return; }
    var h = W.reteDi(nome); if (!h) no("non trovo la rete di " + nome); h.invia(m);
  }
  function indizioBuono(w, C, usati) {
    var tab = vm(C).tab || [];
    for (var i = 0; i < INDIZI.length; i++) if (usati.indexOf(INDIZI[i]) < 0 && !w.__ORDINE.erroreIndizio(INDIZI[i], tab)) return INDIZI[i];
    no("nessun indizio buono");
  }
  async function indizio(C, nomeCapo, n, usati) {
    var w = W.finestra(nomeCapo), p = indizioBuono(w, C, usati);
    manda(nomeCapo, { t: "indizio", parola: p, n: n });
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p; }, 6000)) no("l'indizio non arriva");
    usati.push(p); return p;
  }
  async function gira(C, chi, i) {
    var l0 = vm(C).log || [], n0 = l0.length ? l0[l0.length - 1].n : 0;
    manda(chi, { t: "gira", i: i });
    if (!await W.aspetta(function () { var v = vm(C); var l = v.log || []; return l.length && l[l.length - 1].n > n0 && !v.sospeso && v.tab[i].g; }, 9000, 50)) no(chi + " non gira");
  }
  function indovinoDi(C, k) { var v = vm(C); return ((v.players || []).filter(function (p) { return p.team === k && p.id !== v.capo[k] && !p.via && !p.bot && !p.gu; })[0] || {}).nome; }
  // la mappa del capo di turno: una parola della squadra k (o "n", o "x") ancora coperta
  function unaDi(C, col) {
    var v = vm(C), ch = [], x = -1;
    // (la mappa da un capo qualsiasi che la vede: quello di turno può essere uscito)
    [v.turno].concat(v.capo.map(function (c, k) { return k; })).some(function (k) { var w = W.finestra(nomeDi(C, v.capo[k])); ch = chiaveDa(w); return ch.filter(function (c) { return c != null; }).length >= 20; });
    ch.forEach(function (c, i) { if (x < 0 && c === col && !v.tab[i].g) x = i; });
    return x;
  }
  var O3 = W.O3 = { nomi: [], C: null, prop: null };
  function metti(w) { if (O3.prop && w) { w.__OR_SQ = O3.prop.sq; w.__OR_CHAT = O3.prop.chat; } return w; }
  O3.metti = metti;
  // la saletta: Paky apre, gli amici entrano; sq e capi come chiesto (se dati)
  O3.saletta = async function (amici, sq, capi, imp) {
    if (!W.__prepPO) await COPIONE.carica("preferiti/ordine.js");
    var P = await W.apriTel("Paky", { x: 0, po: true, prima: function (w) { w.__imp = Object.assign({ oro: false }, imp || {}); } });
    metti(P); var C = await W.apriStanza(P, "Parola d'ordine");
    for (var i = 0; i < amici.length; i++) {
      metti(await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 200 * (i + 1) }));
      var quanti = i + 2;
      if (!await W.aspetta(function () { return (vm(C).players || []).length >= quanti; }, 8000)) no(amici[i] + " non entra");
    }
    if (sq) {
      Object.keys(sq).forEach(function (n) { var p = chiDi(C, n); if (p && p.team !== sq[n]) manda(n, { t: "squadra", s: sq[n] }); });
      await W.aspetta(function () { return Object.keys(sq).every(function (n) { var p = chiDi(C, n); return p && p.team === sq[n]; }); }, 6000);
    }
    if (capi) {
      capi.forEach(function (n, k) { if (n && vm(C).capo[k] !== idDi(C, n)) manda(n, { t: "capo" }); });
      await W.aspetta(function () { var c = vm(C).capo || []; return capi.every(function (n, k) { return !n || c[k] === idDi(C, n); }); }, 5000);
    }
    O3.P = P; O3.C = C; O3.nomi = ["Paky"].concat(amici);
    await W.dorme(600);
    return C;
  };
  // la partita: comincia, e qualche turno per riempire la chat
  O3.partita = async function (turni) {
    var C = O3.C, P = O3.P, usati = [];
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).tab; }, 10000)) no("non comincia");
    await W.dorme(vm(C).nsq === 3 ? 3800 : 3000);
    for (var g = 0; g < (turni || 0); g++) {
      var v = vm(C), k = v.turno;
      await indizio(C, nomeDi(C, v.capo[k]), 2, usati);
      var mia = unaDi(C, k); if (mia >= 0) { await gira(C, indovinoDi(C, k), mia); await W.dorme(900); }
      v = vm(C);
      if (v.turno === k && v.fase === "gioco") { var neutra = unaDi(C, "n"); if (neutra >= 0) { await gira(C, indovinoDi(C, k), neutra); await W.dorme(1300); } }
      await W.aspetta(function () { return vm(C).turno !== k || vm(C).fase !== "gioco"; }, 6000);
    }
    // l'ultimo: l'indizio e basta (la squadra sta pensando)
    var v2 = vm(C); if (v2.fase === "gioco" && v2.passo === "indizio") await indizio(C, nomeDi(C, v2.capo[v2.turno]), 2, usati);
    await W.dorme(2500);
    return C;
  };
  O3.idDi = function (n) { return idDi(O3.C, n); };
  O3.vm = function () { return vm(O3.C); };
  O3.capoDi = function (k) { return nomeDi(O3.C, vm(O3.C).capo[k]); };
  O3.indovinoDi = function (k) { return indovinoDi(O3.C, k); };
  // aspetta il passo dell indizio (un turno qualsiasi)
  O3.finoIndizio = async function () { await W.aspetta(function () { var v = vm(O3.C); return v.fase === "gioco" && v.passo === "indizio" && !v.sospeso; }, 9000); };
  O3.indizio = async function (n) { var v = vm(O3.C); var u = O3.usati = O3.usati || []; return indizio(O3.C, nomeDi(O3.C, v.capo[v.turno]), n || 2, u); };
  // la squadra di turno gira una parola del colore col ("x" = la nera, "n" = di nessuno, numero = squadra)
  O3.gira = async function (col) { var v = vm(O3.C), i = unaDi(O3.C, col === "mia" ? v.turno : col); if (i < 0) no("nessuna parola " + col); await gira(O3.C, indovinoDi(O3.C, v.turno), i); return i; };
  O3.segna = function (col) { var v = vm(O3.C), i = unaDi(O3.C, col === "mia" ? v.turno : col); manda(indovinoDi(O3.C, v.turno), { t: "proponi", i: i }); return i; };
  O3.manda = manda;
})();
