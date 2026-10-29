// PROVE DEL CALCIO BILIARDO: il tiro a tutta forza anche dalle pedine vicino al bordo (20 ott 2026).
// Uso (dopo copione-prova.js): await COPIONE.carica("migliora2/calcio-bordi.js"); await COPIONE.prova("cbb1")
// Prima il dito doveva partire dalla pedina: vicino al bordo dello schermo non c'era posto per tirare indietro (e su Android
// il dito sul bordo fa il gesto «indietro»). Ora una pedina toccata resta scelta e si tira trascinando da un punto libero.
//
// cbb1: contro il Bot. Una mia pedina spostata a 1 cm dal bordo: toccata e lasciata = scelta (anello bianco), nessun tiro;
//       trascinando da un punto libero del campo: forza piena (velocità massima), dalla parte opposta alla tirata.
//       Al turno dopo: senza pedina scelta un punto libero non fa niente; tirata dalla pedina e dito tornato indietro =
//       nessun tiro; tirata normale dalla pedina a metà forza = tiro a metà circa.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;

  async function avvia(w) {
    var tess = await W.aspetta(function () { return A.tessera(w, "Calcio Biliardo"); }, 6000);
    if (!tess) no("non trovo la tessera del Calcio Biliardo");
    tess.click(); await W.dorme(450);
    if (!W.clicca(w, /Contro il Bot/, ".modo-grande")) no("in «Come giocate?» non c'è «Contro il Bot»");
    await W.dorme(450);
    W.clicca(w, /Comincia|Gioca|Avanti/); await W.dorme(900);
  }
  function ev(w, cv, tipo, x, y) {
    var r = cv.getBoundingClientRect();
    cv.dispatchEvent(new w.PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: 9, pointerType: "touch", isPrimary: true, clientX: r.left + x, clientY: r.top + y }));
  }
  // il dito: giù, poi si sposta a passi (16 ms l'uno), e (se su) si alza
  async function dito(w, cv, punti, su) {
    ev(w, cv, "pointerdown", punti[0][0], punti[0][1]);
    for (var k = 1; k < punti.length; k++) { await W.dorme(16); ev(w, cv, "pointermove", punti[k][0], punti[k][1]); }
    await W.dorme(16);
    if (su) ev(w, cv, "pointerup", punti[punti.length - 1][0], punti[punti.length - 1][1]);
  }
  function linea(x0, y0, x1, y1, n) { var l = []; for (var k = 0; k <= n; k++) l.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]); return l; }
  function mia(ui) { for (var i = 1; i <= 10; i++) if ((i <= 5 ? 0 : 1) === ui.turno && (!ui.solo || i === ui.solo)) return i; return -1; }
  function schermo(ui, i) { return [ui.ox + ui.S * (ui.o.flip ? 1 - ui.st.x[i] : ui.st.x[i]), ui.oy + ui.S * (ui.o.flip ? 1.55 - ui.st.y[i] : ui.st.y[i])]; }
  // un punto del campo lontano (più di 70 px) da tutte le pedine e dalla palla, verso il centro dello schermo
  function libero(ui) {
    var best = null, bd = -1;
    for (var gx = 0.15; gx <= 0.85; gx += 0.05) for (var gy = 0.2; gy <= 1.35; gy += 0.05) {
      var px = ui.ox + ui.S * gx, py = ui.oy + ui.S * gy, d = Infinity;
      for (var i = 0; i <= 10; i++) { var p = schermo(ui, i); d = Math.min(d, Math.hypot(p[0] - px, p[1] - py)); }
      var c = Math.hypot(px - ui.cw / 2, py - ui.ch / 2);
      if (d > 70 && (best === null || c < bd)) { best = [px, py]; bd = c; }
    }
    return best;
  }
  async function mioTurno(w) { var CB = w.__CB; return W.aspetta(function () { var u = CB && CB.ui; return u && u.puoi && u.st && !u.anim && u.fase === "mira" ? u : null; }, 25000); }

  COPIONE.aggiungi("cbb1", { nome: "Calcio Biliardo: una pedina vicino al bordo si tira a tutta forza trascinando da un punto libero; tirata annullata", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    await avvia(w);
    var CB = w.__CB, ui = await mioTurno(w);
    if (!ui) no("non tocca mai a me (" + T(w).slice(0, 80) + ")");
    var cv = ui.cv, tiri = [];
    var orig = ui.cb.onTiro; ui.cb.onTiro = function (i, vx, vy) { tiri.push({ i: i, v: Math.hypot(vx, vy), vx: vx, vy: vy }); return orig.apply(this, arguments); };
    // una mia pedina a 1 cm dal bordo sinistro dello schermo
    var i = mia(ui); if (i < 0) no("non trovo una mia pedina");
    ui.st.x[i] = Math.max(0.05, (24 - ui.ox) / ui.S);
    var p = schermo(ui, i);
    if (p[0] > 40) no("la pedina non è vicino al bordo (" + Math.round(p[0]) + " px)");
    // 1) tocco e lascio: niente tiro, la pedina resta scelta
    await dito(w, cv, [[p[0], p[1]], [p[0] + 2, p[1]]], true);
    await W.dorme(200);
    if (tiri.length) no("toccata e lasciata, la pedina è partita: " + JSON.stringify(tiri));
    if (ui.scelta !== i) no("toccata e lasciata, la pedina non resta scelta (scelta " + ui.scelta + ")");
    var tx = (w.document.querySelector(".cb-targa.giu .cb-msg") || {}).textContent || "";
    // 2) da un punto libero: tiro indietro verso sinistra di 120 px → forza piena verso destra
    var f = libero(ui); if (!f) no("non trovo un punto libero sul campo");
    await dito(w, cv, linea(f[0], f[1], f[0] - 120, f[1], 10), false);
    if (!ui.mira || ui.mira.i !== i || !ui.mira.lontano) no("trascinando da un punto libero non si mira la pedina scelta (" + JSON.stringify(ui.mira) + ")");
    ev(w, cv, "pointerup", f[0] - 120, f[1]);
    await W.dorme(100);
    if (tiri.length !== 1) no("dal punto libero non parte il tiro (" + tiri.length + ")");
    var t1 = tiri[0];
    if (t1.i !== i) no("è partita la pedina " + t1.i + " invece della " + i);
    if (t1.v < CB.VMAX * 0.98) no("da lontano la forza non è piena: " + t1.v.toFixed(2) + " su " + CB.VMAX);
    if (!(t1.vx > 0) || Math.abs(t1.vy) > Math.abs(t1.vx) * 0.1) no("tirando indietro a sinistra il tiro non va a destra: " + JSON.stringify(t1));
    // 3) il turno dopo: senza pedina scelta un punto libero non fa niente
    ui = await mioTurno(w); if (!ui) no("non torna il mio turno");
    var f2 = libero(ui);
    await dito(w, cv, linea(f2[0], f2[1], f2[0] - 80, f2[1], 6), false);
    if (ui.mira) no("senza pedina scelta, trascinando da un punto libero si mira lo stesso");
    ev(w, cv, "pointerup", f2[0] - 80, f2[1]); await W.dorme(100);
    if (tiri.length !== 1) no("senza pedina scelta è partito un tiro");
    // 4) dalla pedina (quella con più posto sotto, così il bordo non c'entra): tiro indietro di 50 px e torno quasi al
    //    punto di partenza (4 px) = annullato
    var j = -1, q = null;
    for (var k = 1; k <= 10; k++) { if ((k <= 5 ? 0 : 1) !== ui.turno || (ui.solo && k !== ui.solo)) continue; var pk = schermo(ui, k); if (!q || pk[1] < q[1]) { j = k; q = pk; } }
    if (j < 0 || ui.ch - q[1] < 0.22 * ui.S + 40) no("nessuna mia pedina con posto sotto per tirare (" + JSON.stringify(q) + ")");
    await dito(w, cv, linea(q[0], q[1], q[0], q[1] + 50, 5).concat(linea(q[0], q[1] + 50, q[0], q[1] + 4, 5)), true);
    await W.dorme(150);
    if (tiri.length !== 1) no("tornato col dito sulla pedina, il tiro è partito lo stesso: " + JSON.stringify(tiri[tiri.length - 1]));
    // 5) dalla pedina, tirata normale a metà: tiro a metà forza circa (verso l'alto)
    var pieno = 0.22 * ui.S, meta = 10 + (pieno - 10) / 2;
    await dito(w, cv, linea(q[0], q[1], q[0], q[1] + meta, 6), true);
    await W.dorme(150);
    if (tiri.length !== 2) no("la tirata normale dalla pedina non parte");
    var t2 = tiri[1], r2 = t2.v / CB.VMAX;
    if (r2 < 0.35 || r2 > 0.65) no("a metà tirata la forza è " + Math.round(r2 * 100) + "% (doveva essere circa 50%)");
    if (!(t2.vy < 0)) no("tirando giù il tiro non va su: " + JSON.stringify(t2));
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "pedina a " + Math.round(p[0]) + " px dal bordo: toccata = scelta («" + tx + "»), da lontano forza " + Math.round(t1.v / CB.VMAX * 100) + "% verso destra; senza scelta niente; tornato indietro = annullato; a metà tirata " + Math.round(r2 * 100) + "%";
  } });
})();
