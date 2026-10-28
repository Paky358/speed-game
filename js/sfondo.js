// =========================================================
//  SPeeD GAME — 🌙 lo sfondo animato di «Notte vivace» (scelto dal proprietario il 28 ott 2026:
//  «scintillii non fastidiosi e cose simili, così da dare tridimensionalità alla web app»)
//  Sta dietro le schermate del core (home, profilo, Sala, saletta, finestre…), MAI dietro le partite:
//  lo accende e lo spegne js/stile.js (SGStile.aggiorna → SGSfondo.mostra) a ogni cambio di schermata.
//  Tre strati, dal più lontano al più vicino:
//    1) il blu notte coi bordi più scuri (il fondo del body, in css/styles.css: «NOTTE VIVACE»);
//    2) tre grandi luci morbide (lampone, viola, ciano) che si spostano lentissime: un canvas piccolo
//       (96 px di larghezza) che il telefono ingrandisce a tutto schermo, così costa quasi niente;
//    3) pochi scintillii che si accendono e si spengono piano, ognuno ogni volta in un posto nuovo.
//  Profondità: quando si scorre, le luci salgono pochissimo e gli scintillii un po' di più.
//  Regole fisse: si anima solo dentro i canvas (niente sul resto della pagina), al massimo 30 fotogrammi
//  al secondo (20 da fermi, 12 dopo un minuto e mezzo senza tocchi); si ferma con l'app in secondo piano
//  o dietro una partita; con «riduci movimento» un disegno solo, fermo; cambiando schermata resta
//  com'è e non riparte da capo.
// =========================================================
(function () {
  "use strict";

  // ---- le luci: colore, forza, grandezza (rispetto alla larghezza), posto di partenza, quanto e quanto piano si spostano ----
  var LUCI = [
    { c: [110, 80, 255], a: .30, r: 1.05, sy: .62, x: .10, y: .02, ax: .22, ay: .10, tx: 97, ty: 71, f: 0.0, tb: 15 },  // viola, in alto a sinistra
    { c: [224, 34, 90],  a: .28, r: .95, sy: .70, x: .95, y: .10, ax: .18, ay: .12, tx: 83, ty: 109, f: 2.1, tb: 13 }, // lampone, in alto a destra
    { c: [79, 216, 255], a: .16, r: .95, sy: .80, x: .12, y: .86, ax: .24, ay: .10, tx: 113, ty: 89, f: 4.2, tb: 17 }   // ciano, in basso a sinistra
  ];
  var LARGO_LUCI = 96;               // il canvas delle luci è piccolo: le luci sono morbide, non serve dettaglio
  var K_LUCI = .04;                  // quanto si spostano le luci scorrendo (il contenuto si sposta di 1; gli scintillii da .06 a .22: i più vicini di più)
  var COL_SCIN = ["#e6ecff", "#e6ecff", "#e6ecff", "#ffd0de", "#c9f4ff"];   // quasi tutti bianco-azzurro, qualcuno rosa o ciano

  var box = null, cL = null, cS = null, gL = null, gS = null, sprite = {};
  var acceso = false, giro = 0, ultimo = 0, w = 0, h = 0, dpr = 1, lh = 0;
  var scin = [], prima = [];         // gli scintillii e i rettangoli disegnati nel fotogramma prima (si cancellano solo quelli)
  var scorri = { el: null, y: 0 }, offScin = 0, offLuci = 0, metaLuci = 0;   // (offScin: quanto si è scorso in tutto, senza salti)
  var tocco = 0, mosso = 0, costo = 0, lenti = 0;
  var rid = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  function fermo() { return !!(rid && rid.matches); }
  function ora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  // numeri "a caso" sempre uguali per lo stesso scintillio e lo stesso giro (così ogni volta riappare altrove)
  function caso(i, g, k) { var x = Math.sin(i * 127.1 + g * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }

  function crea() {
    if (box || !document.body) return;
    box = document.createElement("div");
    box.className = "sg-sfondo"; box.setAttribute("aria-hidden", "true"); box.hidden = true;
    cL = document.createElement("canvas"); cL.className = "sg-sfondo-luci";
    cS = document.createElement("canvas"); cS.className = "sg-sfondo-scintille";
    box.appendChild(cL); box.appendChild(cS);
    box.style.setProperty("--sg-grana", "url(" + grana() + ")");   // la grana finissima che nasconde le righe nelle sfumature
    document.body.insertBefore(box, document.body.firstChild);
    gL = cL.getContext("2d"); gS = cS.getContext("2d");
    misura();
    window.addEventListener("resize", function () { if (box) { misura(); disegna(ora(), true); } }, { passive: true });
    document.addEventListener("scroll", suScroll, { capture: true, passive: true });
    document.addEventListener("pointerdown", function () { tocco = ora(); }, { capture: true, passive: true });
    document.addEventListener("visibilitychange", decidi);
    if (rid) { var cambia = function () { decidi(); if (acceso) disegna(ora(), true); }; if (rid.addEventListener) rid.addEventListener("change", cambia); else if (rid.addListener) rid.addListener(cambia); }
  }

  // un puntino morbido (e una stellina a quattro punte per i più grandi), disegnato una volta sola per colore
  function faiSprite(col, stella) {
    var s = 64, c = document.createElement("canvas"); c.width = c.height = s;
    var g = c.getContext("2d"), m = s / 2, R = stella ? m * .55 : m;
    var rg = g.createRadialGradient(m, m, 0, m, m, R);
    rg.addColorStop(0, col); rg.addColorStop(.14, col); rg.addColorStop(.36, hexA(col, .3)); rg.addColorStop(1, hexA(col, 0));
    g.fillStyle = rg; g.fillRect(0, 0, s, s);
    if (stella) {   // le punte: sottili e sfumate, in croce
      g.globalCompositeOperation = "lighter";
      [0, 1].forEach(function (v) {
        var lg = v ? g.createLinearGradient(m, 0, m, s) : g.createLinearGradient(0, m, s, m);
        lg.addColorStop(0, hexA(col, 0)); lg.addColorStop(.38, hexA(col, .35)); lg.addColorStop(.5, hexA(col, .95)); lg.addColorStop(.62, hexA(col, .35)); lg.addColorStop(1, hexA(col, 0));
        g.fillStyle = lg;
        if (v) g.fillRect(m - 1, 0, 2, s); else g.fillRect(0, m - 1, s, 2);
      });
    }
    return c;
  }
  // la grana: puntini grigi quasi invisibili (2-3 % di forza), un quadrato che si ripete; si fa una volta sola
  function grana() {
    var s = 128, c = document.createElement("canvas"); c.width = c.height = s;
    var g = c.getContext("2d"), im = g.createImageData(s, s), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var v = caso(i, 3, 9) * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 7; }
    g.putImageData(im, 0, 0);
    try { return c.toDataURL(); } catch (e) { return ""; }
  }
  function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }

  function misura() {
    w = box.clientWidth || window.innerWidth; h = box.clientHeight || window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    lh = Math.max(40, Math.round(LARGO_LUCI * h / Math.max(w, 1)));
    cL.width = LARGO_LUCI; cL.height = lh;
    cS.width = Math.round(w * dpr); cS.height = Math.round(h * dpr);
    gS.setTransform(dpr, 0, 0, dpr, 0, 0);
    prima = [];
    // pochi: uno ogni ~14.000 px² di schermo (23 su un telefono da 390×844), mai più di 30
    var n = Math.max(12, Math.min(30, Math.round(w * h / 14000)));
    if (lenti > 1) n = Math.round(n * .6);
    scin = [];
    for (var i = 0; i < n; i++) {
      // z = quanto è vicino (0 lontano, 1 vicino): i vicini sono più grandi, più luminosi e scorrendo si spostano di più
      var z = caso(i, 0, 1), col = COL_SCIN[Math.floor(caso(i, 0, 2) * COL_SCIN.length)];
      var stella = z > .78, chiave = col + (stella ? "*" : "");
      if (!sprite[chiave]) sprite[chiave] = faiSprite(col, stella);
      scin.push({ d: stella ? 16 + z * 8 : 6 + z * 7, k: .06 + z * .16, sp: sprite[chiave], T: 5.5 + caso(i, 0, 3) * 6.5, f: caso(i, 0, 4),
        a: (.35 + caso(i, 0, 5) * .35) * (.7 + z * .3), su: .45 + caso(i, 0, 6) * .15 });
    }
  }

  // chi scorre: la pagina o il centro di una schermata alta come lo schermo (mai le file che scorrono di lato)
  function suScroll(e) {
    if (!acceso) return;
    var t = e.target, el = (t === document || t === document.documentElement || t === document.body) ? null : t;
    var y = el ? el.scrollTop : (window.scrollY || window.pageYOffset || 0);
    if (el && !(el.scrollHeight > el.clientHeight + 8 && el.clientHeight > h * .35)) return;
    if (scorri.el === el) offScin += y - scorri.y;   // gli scintillii seguono il movimento (girano in tondo: niente salti)
    scorri.el = el; scorri.y = y;
    metaLuci = Math.min(y * K_LUCI, h * .25);                  // le luci vanno verso la loro meta, piano
    mosso = ora();
    if (fermo()) return;
    if (!giro) giro = requestAnimationFrame(passo);
  }

  function disegnaLuci(t) {
    gL.globalCompositeOperation = "source-over";
    gL.clearRect(0, 0, LARGO_LUCI, lh);
    gL.globalCompositeOperation = "lighter";
    var k = LARGO_LUCI, oy = offLuci / Math.max(h, 1) * lh;
    for (var i = 0; i < LUCI.length; i++) {
      var L = LUCI[i], s = t / 1000;
      var x = (L.x + L.ax * Math.sin(2 * Math.PI * s / L.tx + L.f)) * k;
      var y = (L.y + L.ay * Math.sin(2 * Math.PI * s / L.ty + L.f * 1.7)) * lh - oy;
      var a = L.a * (.88 + .12 * Math.sin(2 * Math.PI * s / L.tb + L.f));
      var r = L.r * k, c = L.c.join(",");
      gL.save(); gL.translate(x, y); gL.scale(1, L.sy);   // (un po' schiacciate: luci larghe, come fari)
      var g = gL.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, "rgba(" + c + "," + a + ")"); g.addColorStop(.28, "rgba(" + c + "," + (a * .72).toFixed(3) + ")");
      g.addColorStop(.55, "rgba(" + c + "," + (a * .34).toFixed(3) + ")"); g.addColorStop(.8, "rgba(" + c + "," + (a * .1).toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + c + ",0)");
      gL.fillStyle = g; gL.fillRect(-r, -r, 2 * r, 2 * r);
      gL.restore();
    }
  }

  function disegnaScintille(t, tutto) {
    if (tutto) gS.clearRect(0, 0, w, h);
    else for (var p = 0; p < prima.length; p++) gS.clearRect(prima[p][0], prima[p][1], prima[p][2], prima[p][2]);
    prima = [];
    var s = t / 1000, alto = h + 40;
    for (var i = 0; i < scin.length; i++) {
      var S = scin[i], u = s / S.T + S.f, giroN = Math.floor(u), f = u - giroN;
      if (f >= S.su) continue;                        // spento: aspetta il prossimo giro
      var luce = Math.sin(Math.PI * f / S.su); luce = luce * luce;   // si accende e si spegne piano, mai di colpo
      var a = S.a * luce; if (a < .02) continue;
      var x = 8 + caso(i, giroN, 7) * (w - 16);
      var y = caso(i, giroN, 8) * alto - offScin * S.k; y = ((y % alto) + alto) % alto - 20;
      var d = S.d;
      gS.globalAlpha = a;
      gS.drawImage(S.sp, x - d / 2, y - d / 2, d, d);
      prima.push([Math.floor(x - d / 2) - 1, Math.floor(y - d / 2) - 1, Math.ceil(d) + 2]);
    }
    gS.globalAlpha = 1;
  }

  function disegna(t, tutto) {
    if (!box || box.hidden) return;
    var t0 = ora();
    offLuci += (metaLuci - offLuci) * (tutto ? 1 : .18);
    disegnaLuci(t);
    disegnaScintille(t, tutto);
    var c = ora() - t0;
    costo = costo * .95 + c * .05;
  }

  // quanti fotogrammi: 30 mentre si scorre o si tocca, 20 da fermi, 12 dopo un minuto e mezzo senza tocchi
  function intervallo(t) {
    var vivo = Math.max(tocco, mosso);
    if (t - mosso < 1200) return 1000 / 30;
    if (t - vivo > 90000) return 1000 / 12;
    return lenti > 0 ? 1000 / 15 : 1000 / 20;
  }

  function passo(t) {
    giro = 0;
    if (!acceso || fermo() || document.hidden) return;
    if (t - ultimo >= intervallo(t) - 2) {
      ultimo = t;
      disegna(t, false);
      // un telefono che fatica (più di 7 ms a disegnare): meno fotogrammi e meno scintillii
      if (costo > 7 && lenti < 2) { lenti++; costo = 0; misura(); disegna(t, true); }
    }
    giro = requestAnimationFrame(passo);
  }

  function decidi() {
    if (!box) return;
    if (giro) { cancelAnimationFrame(giro); giro = 0; }
    if (!acceso || document.hidden) return;
    if (fermo()) { metaLuci = offLuci = 0; disegna(ora(), true); return; }   // riduci movimento: un disegno solo, fermo
    giro = requestAnimationFrame(passo);
  }

  window.SGSfondo = {
    // true = una schermata del core è in vista (lo sfondo si vede e si muove), false = una partita (spento e fermo)
    mostra: function (si) {
      si = !!si;
      if (si) crea();
      if (!box) return;
      var era = acceso; acceso = si;
      if (si && !era) {
        box.hidden = false;
        scorri = { el: null, y: window.scrollY || 0 };
        if (box.clientWidth !== w || box.clientHeight !== h) misura();
        disegna(ora(), true);
      } else if (!si && era) box.hidden = true;
      else if (si) scorri = { el: null, y: window.scrollY || 0 };   // schermata nuova: si riparte da dove si è, senza salti
      metaLuci = Math.min((window.scrollY || 0) * K_LUCI, h * .25);
      decidi();
    },
    // per le prove: quanto costa disegnare (ms) e se sta girando
    stato: function () { return { acceso: acceso, gira: !!giro, costo: +costo.toFixed(2), lenti: lenti, scintille: scin.length, fermo: fermo() }; }
  };
})();
