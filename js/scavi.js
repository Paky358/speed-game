/* =========================================================
   SPeeD GAME — GLI SCAVI ANTICHI (fuori città, oltre il parco)
   Si gioca in due momenti, come la pesca:
   1. IL CAMPO: un terreno 9×9 diviso coi picchetti e lo spago. Tocchi un quadrato: il tuo avatar ci va e scava.
      Niente intorno → ❌ su tutto il quadrato attorno (come in Pet Society); qualcosa vicino → la bandierina ✅.
      6 colpi al giorno (altri si comprano). Ogni giorno il campo è nuovo; a volte un coccio in superficie fa da indizio.
   2. L'ESTRAZIONE (presa dal Sotterraneo di Pokémon): la terra a quadretti e a strati, il piccone (veloce, ma fa
      franare e crepa il reperto) e il pennello (piano e sicuro). Se frana, tieni solo quello che è già fuori.
   Poi la carta del reperto: lo vendi o lo tieni nello zaino. Il museo raccoglie tutti i pezzi, epoca per epoca.
   Più è raro, più è in fondo e più è fragile. La maschera d'oro del faraone è leggendaria.
   SGScavi.crea({ omino, dati, salva(dati), monete(), cambia(n), audio(), seme, indietro }) -> schermata (poi ._monta())
   ========================================================= */
(function () {
  "use strict";

  var N = 9, COLPI_GIORNO = 6, NASCOSTI = 3, PACCO = { n: 5, prezzo: 500 }, ZAINO_MAX = 40, PREMIO_EPOCA = 2000;
  var EPOCHE = [
    { id: "preistoria", nome: "Preistoria", ico: "🦴" }, { id: "egitto", nome: "Antico Egitto", ico: "🔺" },
    { id: "grecia", nome: "Antica Grecia", ico: "🏛️" }, { id: "roma", nome: "Antica Roma", ico: "🛡️" }
  ];
  var RARITA = ["", "Comune", "Non comune", "Rara", "Epica", "Leggendaria"], COL_R = ["", "#868e96", "#2f9e44", "#1c7ed6", "#9c36b5", "#f59f00"];
  // i reperti: r = rarità (1 comune … 5 leggendaria), m = la forma sotto terra (X = un quadretto occupato)
  var REPERTI = [
    { id: "freccia", nome: "Punta di freccia", epoca: "preistoria", quando: "8000 a.C.", r: 1, v: 300, m: ["X", "X"] },
    { id: "dente", nome: "Dente di mammut", epoca: "preistoria", quando: "20000 a.C.", r: 2, v: 700, m: ["X.", "XX"] },
    { id: "ammonite", nome: "Ammonite fossile", epoca: "preistoria", quando: "150 milioni di anni fa", r: 2, v: 650, m: ["XX", "XX"] },
    { id: "teschio", nome: "Teschio di dinosauro", epoca: "preistoria", quando: "70 milioni di anni fa", r: 4, v: 3500, m: ["XXX", "XX."] },
    { id: "scarabeo", nome: "Scarabeo sacro", epoca: "egitto", quando: "1500 a.C.", r: 2, v: 600, m: ["X"] },
    { id: "gatto", nome: "Statuetta del gatto", epoca: "egitto", quando: "1200 a.C.", r: 4, v: 3200, m: ["X.", "XX", "XX"] },
    { id: "maschera", nome: "Maschera d'oro del faraone", epoca: "egitto", quando: "1300 a.C.", r: 5, v: 12000, m: ["XXX", "XXX", ".X."] },
    { id: "civetta", nome: "Moneta con la civetta", epoca: "grecia", quando: "450 a.C.", r: 2, v: 500, m: ["X"] },
    { id: "vaso", nome: "Vaso greco dipinto", epoca: "grecia", quando: "500 a.C.", r: 3, v: 1600, m: ["XX", "XX", "XX"] },
    { id: "elmo", nome: "Elmo corinzio", epoca: "grecia", quando: "600 a.C.", r: 4, v: 3000, m: ["XX", "XX"] },
    { id: "chiodo", nome: "Chiodo arrugginito", epoca: "roma", quando: "80 d.C.", r: 1, v: 90, m: ["X", "X"] },
    { id: "coccio", nome: "Coccio di vaso", epoca: "roma", quando: "200 d.C.", r: 1, v: 120, m: ["XX"] },
    { id: "moneta", nome: "Moneta d'argento", epoca: "roma", quando: "50 a.C.", r: 2, v: 300, m: ["X"] },
    { id: "lucerna", nome: "Lucerna a olio", epoca: "roma", quando: "100 d.C.", r: 2, v: 550, m: ["XX"] },
    { id: "anfora", nome: "Anfora romana", epoca: "roma", quando: "100 d.C.", r: 3, v: 1500, m: [".X.", "XXX", "XXX", ".X."] },
    { id: "gladio", nome: "Gladio del legionario", epoca: "roma", quando: "50 d.C.", r: 3, v: 1900, m: ["X", "X", "X"] }
  ];
  var PER_ID = {}; REPERTI.forEach(function (x) { PER_ID[x.id] = x; });
  var PICCOLI = ["moneta", "civetta", "scarabeo", "coccio"];   // le sorprese in più nella buca

  // ---------- attrezzi ----------
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function hash(t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function oggi() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function fase() { try { return window.SGCitta ? SGCitta.fase(new Date()) : "giorno"; } catch (e) { return "giorno"; } }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }   // solo quando si tocca
  function valoreDi(id, integro) { return Math.round(PER_ID[id].v * (0.4 + 0.6 * (integro == null ? 100 : integro) / 100)); }
  function datiIniziali() { return { v: 1, album: {}, zaino: [], colpi: { g: oggi(), usati: 0 }, extra: 0, campo: null, inCorso: null, premi: {}, tot: 0 }; }

  // ---------- i suoni ----------
  var AUDIO = null, CHIAVE_SUONI = "sg-sv-suoni";
  function suoniOn() { try { return localStorage.getItem(CHIAVE_SUONI) !== "0"; } catch (e) { return true; } }
  function tono(f, quando, dur, tipo, vol, fine) {
    if (!suoniOn()) return; var c = AUDIO && AUDIO(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), a = c.currentTime + (quando || 0);
      o.type = tipo || "sine"; o.frequency.setValueAtTime(f, a); if (fine) o.frequency.exponentialRampToValueAtTime(fine, a + dur);
      g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(vol || 0.1, a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + dur);
      o.connect(g); g.connect(c.destination); o.start(a); o.stop(a + dur + 0.05);
    } catch (e) {}
  }
  function suonoPala() { tono(130, 0, .14, "triangle", .22, 60); tono(240, .02, .08, "sawtooth", .03, 120); }
  function suonoX() { tono(300, 0, .09, "triangle", .06, 200); }
  function suonoSi() { tono(660, 0, .1, "triangle", .1); tono(880, .09, .16, "triangle", .1); }
  function suonoTrovato() { [0, 4, 7, 12].forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * .08, .3, "triangle", .1); }); }
  function suonoTerra() { tono(220, 0, .08, "sawtooth", .045, 110); }
  function suonoPennello() { tono(900, 0, .06, "sine", .025, 600); }
  function suonoTok() { tono(700, 0, .05, "square", .07); tono(500, .05, .08, "square", .05); }
  function suonoCrepa() { tono(1800, 0, .04, "square", .07); tono(1200, .04, .06, "square", .05); }
  function suonoFrana() { tono(90, 0, .8, "sawtooth", .16, 40); }
  function suonoMonete() { [0, 7, 12].forEach(function (k, i) { tono(1046 * Math.pow(2, k / 12), i * .06, .15, "triangle", .07); }); }
  function suonoCarta(r) { [0, 4, 7, 12, 16].slice(0, 1 + r).forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * .08, .3, "triangle", .09); }); }

  // ---------- il disegno dei reperti (per la fossa, la carta e il museo): x,y,w,h = il riquadro; integro = le crepe ----------
  function seme01(i, k) { var s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }
  function disegnaReperto(c, id, x, y, w, h, integro, ombra) {
    c.save(); c.translate(x, y); c.lineJoin = "round"; c.lineCap = "round";
    var S = function (f, s, lw) { c.fillStyle = ombra ? "rgba(30,20,12,.55)" : f; c.strokeStyle = ombra ? "rgba(30,20,12,.7)" : s; c.lineWidth = lw || 2; };
    function forma(fn) { c.beginPath(); fn(); c.fill(); c.stroke(); }
    var g;
    if (id === "anfora") {
      S("#c8673a", "#6b2f14");
      forma(function () { c.ellipse(w / 2, h * .55, w * .42, h * .33, 0, 0, 6.29); });
      forma(function () { c.rect(w * .38, h * .08, w * .24, h * .2); });
      c.lineWidth = Math.max(3, w * .05); c.beginPath(); c.moveTo(w * .38, h * .14); c.quadraticCurveTo(w * .12, h * .15, w * .2, h * .36); c.moveTo(w * .62, h * .14); c.quadraticCurveTo(w * .88, h * .15, w * .8, h * .36); c.stroke(); c.lineWidth = 2;
      forma(function () { c.moveTo(w * .42, h * .86); c.lineTo(w / 2, h * .97); c.lineTo(w * .58, h * .86); });
      if (!ombra) { c.fillStyle = "#2b1a10"; c.fillRect(w * .12, h * .5, w * .76, h * .05); c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.ellipse(w * .35, h * .42, w * .06, h * .12, 0, 0, 6.29); c.fill(); }
    } else if (id === "gatto") {
      S("#2d2a35", "#0f0d14");
      forma(function () { c.moveTo(w * .25, h * .98); c.quadraticCurveTo(w * .1, h * .55, w * .35, h * .38); c.lineTo(w * .3, h * .05); c.lineTo(w * .45, h * .2); c.lineTo(w * .6, h * .05); c.lineTo(w * .58, h * .38); c.quadraticCurveTo(w * .95, h * .6, w * .85, h * .98); c.closePath(); });
      if (!ombra) { c.fillStyle = "#e6b84a"; c.beginPath(); c.arc(w * .38, h * .28, Math.max(1.5, w * .04), 0, 6.29); c.arc(w * .52, h * .28, Math.max(1.5, w * .04), 0, 6.29); c.fill(); c.strokeStyle = "#e6b84a"; c.lineWidth = Math.max(2, w * .05); c.beginPath(); c.moveTo(w * .32, h * .45); c.quadraticCurveTo(w * .47, h * .52, w * .62, h * .45); c.stroke(); c.beginPath(); c.arc(w * .6, h * .12, w * .05, 0, 6.29); c.stroke(); }
    } else if (id === "freccia") {
      S("#6f7a83", "#2f363c");
      forma(function () { c.moveTo(w / 2, h * .04); c.lineTo(w * .86, h * .62); c.lineTo(w * .62, h * .7); c.lineTo(w * .6, h * .96); c.lineTo(w * .4, h * .96); c.lineTo(w * .38, h * .7); c.lineTo(w * .14, h * .62); c.closePath(); });
      if (!ombra) { c.strokeStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.moveTo(w / 2, h * .12); c.lineTo(w * .5, h * .6); c.stroke(); }
    } else if (id === "moneta" || id === "civetta") {
      S(id === "civetta" ? "#d8dbe0" : "#c9ccd2", "#6c7078");
      forma(function () { c.arc(w / 2, h / 2, Math.min(w, h) * .38, 0, 6.29); });
      if (!ombra) {
        c.lineWidth = 1; c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) * .28, 0, 6.29); c.stroke();
        c.fillStyle = "#7d828b";
        if (id === "civetta") { c.beginPath(); c.ellipse(w / 2, h * .54, w * .1, h * .13, 0, 0, 6.29); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(w * .46, h * .48, w * .03, 0, 6.29); c.arc(w * .54, h * .48, w * .03, 0, 6.29); c.fill(); }
        else { c.beginPath(); c.arc(w * .47, h * .45, w * .1, 0, 6.29); c.fill(); }
      }
    } else if (id === "coccio") {
      S("#c8673a", "#6b2f14");
      forma(function () { c.moveTo(w * .08, h * .3); c.lineTo(w * .55, h * .12); c.lineTo(w * .92, h * .38); c.lineTo(w * .7, h * .88); c.lineTo(w * .42, h * .7); c.lineTo(w * .18, h * .86); c.closePath(); });
      if (!ombra) { c.strokeStyle = "#2b1a10"; c.lineWidth = Math.max(2, h * .06); c.beginPath(); c.moveTo(w * .2, h * .45); c.quadraticCurveTo(w * .5, h * .3, w * .8, h * .5); c.stroke(); }
    } else if (id === "chiodo") {
      S("#8a4b25", "#4a240f");
      forma(function () { c.ellipse(w / 2, h * .1, w * .3, h * .06, 0, 0, 6.29); });
      forma(function () { c.moveTo(w * .42, h * .14); c.lineTo(w * .58, h * .14); c.lineTo(w * .54, h * .82); c.lineTo(w / 2, h * .96); c.lineTo(w * .46, h * .82); c.closePath(); });
      if (!ombra) { c.fillStyle = "#b8662f"; c.beginPath(); c.arc(w * .5, h * .4, w * .06, 0, 6.29); c.arc(w * .52, h * .62, w * .05, 0, 6.29); c.fill(); }
    } else if (id === "maschera") {
      if (!ombra) { g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffe9a0"); g.addColorStop(.5, "#e2b13a"); g.addColorStop(1, "#a8761a"); }
      S("#1f4f9a", "#14233d");
      forma(function () { c.moveTo(w * .05, h * .2); c.lineTo(w * .3, h * .05); c.lineTo(w * .7, h * .05); c.lineTo(w * .95, h * .2); c.lineTo(w * .88, h * .62); c.lineTo(w * .12, h * .62); c.closePath(); });
      if (!ombra) { c.strokeStyle = "#e2b13a"; c.lineWidth = Math.max(2, w * .025); for (var sr = 0; sr < 5; sr++) { c.beginPath(); c.moveTo(w * (.1 + sr * .04), h * (.25 + sr * .04)); c.lineTo(w * (.18 + sr * .04), h * .6); c.moveTo(w * (.9 - sr * .04), h * (.25 + sr * .04)); c.lineTo(w * (.82 - sr * .04), h * .6); c.stroke(); } }
      c.fillStyle = ombra ? "rgba(30,20,12,.55)" : g; c.strokeStyle = ombra ? "rgba(30,20,12,.7)" : "#6e4a0c"; c.lineWidth = 2;
      forma(function () { c.ellipse(w / 2, h * .42, w * .26, h * .32, 0, 0, 6.29); });
      forma(function () { c.moveTo(w * .44, h * .7); c.lineTo(w * .56, h * .7); c.lineTo(w * .53, h * .98); c.lineTo(w * .47, h * .98); c.closePath(); });
      if (!ombra) { c.fillStyle = "#14233d"; c.beginPath(); c.ellipse(w * .4, h * .36, w * .06, h * .03, 0, 0, 6.29); c.ellipse(w * .6, h * .36, w * .06, h * .03, 0, 0, 6.29); c.fill(); c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.ellipse(w * .4, h * .24, w * .05, h * .08, -.4, 0, 6.29); c.fill(); }
    } else if (id === "dente") {
      S("#efe3c8", "#8a7550");
      forma(function () { c.moveTo(w * .15, h * .12); c.quadraticCurveTo(w * .05, h * .8, w * .9, h * .9); c.quadraticCurveTo(w * .5, h * .62, w * .42, h * .1); c.closePath(); });
      if (!ombra) { c.strokeStyle = "rgba(138,117,80,.5)"; c.lineWidth = 1; for (var dk = 1; dk < 5; dk++) { c.beginPath(); c.moveTo(w * (.12 + dk * .05), h * (.15 + dk * .14)); c.lineTo(w * (.35 + dk * .08), h * (.12 + dk * .15)); c.stroke(); } }
    } else if (id === "ammonite") {
      S("#b79a6a", "#5e4a2c");
      forma(function () { c.arc(w / 2, h / 2, Math.min(w, h) * .44, 0, 6.29); });
      if (!ombra) {
        c.strokeStyle = "#5e4a2c"; c.lineWidth = Math.max(1.5, w * .03); c.beginPath();
        for (var a = 0; a < 14; a += .2) { var rr = Math.min(w, h) * .42 * Math.exp(-a * .13); var px = w / 2 + Math.cos(a) * rr, py = h / 2 + Math.sin(a) * rr; if (a === 0) c.moveTo(px, py); else c.lineTo(px, py); }
        c.stroke(); c.lineWidth = 1; for (var b = 0; b < 12; b++) { var an = b * .52, r1 = Math.min(w, h) * .42, r2 = r1 * .62; c.beginPath(); c.moveTo(w / 2 + Math.cos(an) * r2, h / 2 + Math.sin(an) * r2); c.lineTo(w / 2 + Math.cos(an) * r1, h / 2 + Math.sin(an) * r1); c.stroke(); }
      }
    } else if (id === "teschio") {
      S("#e8dcc0", "#6e5e40");
      forma(function () { c.moveTo(w * .05, h * .45); c.quadraticCurveTo(w * .1, h * .08, w * .45, h * .1); c.quadraticCurveTo(w * .8, h * .12, w * .97, h * .42); c.lineTo(w * .95, h * .62); c.lineTo(w * .55, h * .66); c.lineTo(w * .45, h * .92); c.lineTo(w * .3, h * .7); c.quadraticCurveTo(w * .08, h * .7, w * .05, h * .45); c.closePath(); });
      if (!ombra) {
        c.fillStyle = "#3a2e1f"; c.beginPath(); c.ellipse(w * .3, h * .36, w * .07, h * .1, 0, 0, 6.29); c.fill(); c.beginPath(); c.ellipse(w * .62, h * .34, w * .05, h * .07, 0, 0, 6.29); c.fill();
        c.fillStyle = "#fff"; for (var dd = 0; dd < 6; dd++) { c.beginPath(); c.moveTo(w * (.6 + dd * .055), h * .62); c.lineTo(w * (.63 + dd * .055), h * .72); c.lineTo(w * (.66 + dd * .055), h * .62); c.fill(); }
      }
    } else if (id === "scarabeo") {
      S("#2f9e8f", "#11524a");
      forma(function () { c.ellipse(w / 2, h * .55, w * .3, h * .34, 0, 0, 6.29); });
      forma(function () { c.ellipse(w / 2, h * .2, w * .16, h * .12, 0, 0, 6.29); });
      if (!ombra) { c.strokeStyle = "#e2b13a"; c.lineWidth = Math.max(1.5, w * .04); c.beginPath(); c.moveTo(w / 2, h * .25); c.lineTo(w / 2, h * .88); c.stroke(); c.beginPath(); c.moveTo(w * .2, h * .45); c.lineTo(w * .08, h * .35); c.moveTo(w * .8, h * .45); c.lineTo(w * .92, h * .35); c.moveTo(w * .22, h * .7); c.lineTo(w * .08, h * .8); c.moveTo(w * .78, h * .7); c.lineTo(w * .92, h * .8); c.stroke(); }
    } else if (id === "vaso") {
      S("#d9822b", "#4a2810");
      forma(function () { c.moveTo(w * .3, h * .05); c.lineTo(w * .7, h * .05); c.lineTo(w * .62, h * .18); c.quadraticCurveTo(w * 1.02, h * .4, w * .72, h * .9); c.lineTo(w * .28, h * .9); c.quadraticCurveTo(-w * .02, h * .4, w * .38, h * .18); c.closePath(); });
      forma(function () { c.rect(w * .3, h * .9, w * .4, h * .07); });
      if (!ombra) { c.fillStyle = "#1b1b1b"; c.fillRect(w * .12, h * .38, w * .76, h * .2); c.fillStyle = "#d9822b"; c.beginPath(); c.arc(w * .4, h * .46, w * .05, 0, 6.29); c.fill(); c.fillRect(w * .38, h * .5, w * .04, h * .07); c.beginPath(); c.arc(w * .6, h * .46, w * .05, 0, 6.29); c.fill(); c.fillRect(w * .58, h * .5, w * .04, h * .07); c.strokeStyle = "#1b1b1b"; c.lineWidth = Math.max(1, w * .02); c.beginPath(); for (var zx = 0; zx < 6; zx++) { c.moveTo(w * (.22 + zx * .1), h * .68); c.lineTo(w * (.27 + zx * .1), h * .74); c.lineTo(w * (.32 + zx * .1), h * .68); } c.stroke(); }
    } else if (id === "elmo") {
      if (!ombra) { g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#8c5a2b"); g.addColorStop(.5, "#d9a85a"); g.addColorStop(1, "#7a4a20"); }
      c.fillStyle = ombra ? "rgba(30,20,12,.55)" : g; c.strokeStyle = ombra ? "rgba(30,20,12,.7)" : "#4a2a10"; c.lineWidth = 2;
      forma(function () { c.moveTo(w * .12, h * .95); c.quadraticCurveTo(w * .02, h * .1, w * .5, h * .08); c.quadraticCurveTo(w * .98, h * .1, w * .88, h * .95); c.lineTo(w * .64, h * .95); c.lineTo(w * .6, h * .62); c.lineTo(w * .4, h * .62); c.lineTo(w * .36, h * .95); c.closePath(); });
      if (!ombra) { c.fillStyle = "#1b1b1b"; c.beginPath(); c.moveTo(w * .22, h * .45); c.lineTo(w * .45, h * .42); c.lineTo(w * .45, h * .6); c.lineTo(w * .3, h * .7); c.closePath(); c.moveTo(w * .78, h * .45); c.lineTo(w * .55, h * .42); c.lineTo(w * .55, h * .6); c.lineTo(w * .7, h * .7); c.closePath(); c.fill(); c.fillStyle = "#c92a2a"; c.fillRect(w * .44, 0, w * .12, h * .1); }
    } else if (id === "lucerna") {
      S("#b5652f", "#5a2d12");
      forma(function () { c.ellipse(w * .42, h * .58, w * .32, h * .3, 0, 0, 6.29); });
      forma(function () { c.moveTo(w * .66, h * .45); c.lineTo(w * .95, h * .5); c.lineTo(w * .95, h * .66); c.lineTo(w * .66, h * .7); c.closePath(); });
      if (!ombra) { c.fillStyle = "#3a1d0b"; c.beginPath(); c.arc(w * .42, h * .52, w * .07, 0, 6.29); c.fill(); c.beginPath(); c.arc(w * .9, h * .58, w * .03, 0, 6.29); c.fill(); c.fillStyle = "#ffd43b"; c.beginPath(); c.moveTo(w * .9, h * .5); c.quadraticCurveTo(w * .96, h * .38, w * .9, h * .28); c.quadraticCurveTo(w * .85, h * .4, w * .9, h * .5); c.fill(); }
    } else if (id === "gladio") {
      S("#adb5bd", "#495057");
      forma(function () { c.moveTo(w / 2, h * .02); c.lineTo(w * .68, h * .12); c.lineTo(w * .66, h * .64); c.lineTo(w * .34, h * .64); c.lineTo(w * .32, h * .12); c.closePath(); });
      S("#c9a227", "#6e5509"); forma(function () { c.rect(w * .1, h * .64, w * .8, h * .06); });
      S("#6b3f1f", "#3a200d"); forma(function () { c.rect(w * .38, h * .7, w * .24, h * .22); });
      S("#c9a227", "#6e5509"); forma(function () { c.arc(w / 2, h * .95, w * .16, 0, 6.29); });
    } else {   // (una gemma, per sicurezza)
      S("#3cc8d8", "#11707a"); forma(function () { c.moveTo(w / 2, h * .14); c.lineTo(w * .84, h * .4); c.lineTo(w / 2, h * .88); c.lineTo(w * .16, h * .4); c.closePath(); });
    }
    if (!ombra && integro != null && integro < 100) {   // le crepe
      c.strokeStyle = "rgba(20,10,5,.85)"; c.lineWidth = 1.6; var n = Math.ceil((100 - integro) / 15), k2 = Math.min(w, h) / 40;
      for (var q = 0; q < n; q++) { var cx = w * (.25 + .5 * seme01(q, 3)), cy = h * (.2 + .6 * seme01(q, 7)); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 6 * k2, cy + 5 * k2); c.lineTo(cx + 3 * k2, cy + 10 * k2); c.lineTo(cx + 8 * k2, cy + 15 * k2); c.stroke(); }
    }
    c.restore();
  }
  function tela(id, px, integro, ombra) {   // un reperto disegnato in un riquadro px×px (per la carta e il museo)
    var dpr = Math.min(2, window.devicePixelRatio || 1), cv = el("canvas"), R = PER_ID[id], w = R.m[0].length, h = R.m.length, k = px * .78 / Math.max(w, h);
    cv.width = px * dpr; cv.height = px * dpr; cv.style.width = cv.style.height = px + "px";
    var c = cv.getContext("2d"); c.scale(dpr, dpr); disegnaReperto(c, id, px / 2 - w * k / 2, px / 2 - h * k / 2, w * k, h * k, integro, ombra); return cv;
  }

  // =========================================================
  //  LA SCHERMATA DEGLI SCAVI
  // =========================================================
  function crea(opts) {
    stile();
    AUDIO = opts.audio || null;
    var D = opts.dati && opts.dati.v ? opts.dati : datiIniziali();
    D.album = D.album || {}; D.zaino = D.zaino || []; D.colpi = D.colpi || { g: oggi(), usati: 0 }; D.extra = D.extra || 0; D.premi = D.premi || {}; D.tot = D.tot || 0;
    function salva() { if (opts.salva) opts.salva(D); }
    function monete() { return opts.monete ? opts.monete() : 0; }
    function colpi() { if (opts.illimitati) return 99; if (D.colpi.g !== oggi()) D.colpi = { g: oggi(), usati: 0 }; return Math.max(0, COLPI_GIORNO - D.colpi.usati) + D.extra; }
    function usaColpo() { if (opts.illimitati) return; colpi(); if (D.colpi.usati < COLPI_GIORNO) D.colpi.usati++; else D.extra = Math.max(0, D.extra - 1); }

    // ---- il campo del giorno: sempre uguale per tutto il giorno (si riprende da dove eri) ----
    var R0 = rnd(hash(oggi() + "|" + (opts.seme || "scavi")));
    function sorteggia(r) {   // quasi sempre roba comune; i pezzi rari sono rari davvero
      var x = r(), rar = x < .02 ? 5 : x < .08 ? 4 : x < .2 ? 3 : x < .5 ? 2 : 1, l = REPERTI.filter(function (p) { return p.r === rar; });
      return l[Math.floor(r() * l.length)].id;
    }
    var nascosti = [];
    while (nascosti.length < NASCOSTI) { var rr = Math.floor(R0() * N), cc = Math.floor(R0() * N); if (nascosti.every(function (p) { return Math.max(Math.abs(p.r - rr), Math.abs(p.c - cc)) >= 3; })) nascosti.push({ r: rr, c: cc, id: sorteggia(R0) }); }
    var indizio = null;
    if (R0() < .4) { var pn = nascosti[Math.floor(R0() * NASCOSTI)], ds = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1]].filter(function (d) { var a = pn.r + d[0], b = pn.c + d[1]; return a >= 0 && b >= 0 && a < N && b < N; }); var d0 = ds[Math.floor(R0() * ds.length)]; indizio = { r: pn.r + d0[0], c: pn.c + d0[1] }; }
    if (!D.campo || D.campo.g !== oggi() || !D.campo.stato || D.campo.stato.length !== N * N) { D.campo = { g: oggi(), stato: [] }; for (var q0 = 0; q0 < N * N; q0++) D.campo.stato.push(0); D.inCorso = null; }
    // stato di un quadrato: 0 = da scavare, 1 = ❌ (visto vuoto), 2 = scavato con la bandierina ✅, 4 = scavato, c'era un reperto, 5 = scavato e vuoto (❌)
    function st(r, c) { return D.campo.stato[r * N + c]; }
    function metti(r, c, v) { D.campo.stato[r * N + c] = v; }
    function nascostoIn(r, c) { return nascosti.filter(function (p) { return p.r === r && p.c === c && st(r, c) !== 4; })[0]; }
    function vicini(r, c) { var n = 0; for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) if ((dr || dc) && nascostoIn(r + dr, c + dc)) n++; return n; }
    function rimasti() { return nascosti.filter(function (p) { return st(p.r, p.c) !== 4; }).length; }

    // ---- la struttura ----
    var s = el("div", "schermata sv-vista"), cv = el("canvas", "sv-tela"), ctx = cv.getContext("2d");
    var testa = el("div", "sv-testa"), bInd = el("button", "sv-tasto", "‹"), nome = el("div", "sv-nome", "🏺 Scavi antichi"), cColpi = el("div", "sv-chip"), cMonete = el("div", "sv-chip");
    bInd.setAttribute("aria-label", "Indietro"); bInd.onclick = function () { esci(); };
    var bSuoni = el("button", "sv-tasto", suoniOn() ? "🔊" : "🔇"); bSuoni.setAttribute("aria-label", "Suoni");
    bSuoni.onclick = function () { var on = !suoniOn(); try { localStorage.setItem(CHIAVE_SUONI, on ? "1" : "0"); } catch (e) {} bSuoni.textContent = on ? "🔊" : "🔇"; };
    [bInd, bSuoni, nome, cColpi, cMonete].forEach(function (n) { testa.appendChild(n); });
    var giu = el("div", "sv-giu"), bMuseo = el("button", "sv-bott", "🏛️ Museo"), bZaino = el("button", "sv-bott"), bColpi = el("button", "sv-bott", "⛏️ Colpi");
    bMuseo.onclick = function () { museo(); }; bZaino.onclick = function () { zaino(); }; bColpi.onclick = function () { compraColpi(); };
    [bMuseo, bZaino, bColpi].forEach(function (b) { giu.appendChild(b); });
    var prof = el("div", "sv-prof"), avviso = el("div", "sv-avviso"), sopra = el("div", "sv-sopra"), fossa = el("div", "sv-fossa");
    [cv, testa, giu, prof, avviso, fossa, sopra].forEach(function (n) { s.appendChild(n); });
    function aggTesta() { cColpi.textContent = "⛏️ " + (opts.illimitati ? "∞" : colpi()); cMonete.textContent = "🪙 " + cifre(monete()); bZaino.textContent = "🎒 Zaino" + (D.zaino.length ? " (" + D.zaino.length + ")" : ""); }
    function dimmi(t) { avviso.textContent = t; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    var profUltimo = "";
    function parla(t) { if (t === profUltimo) return; profUltimo = t; prof.innerHTML = ""; prof.appendChild(el("b", null, "Prof. Ida")); prof.appendChild(document.createTextNode(t)); prof.classList.remove("su"); void prof.offsetWidth; prof.classList.add("su"); }
    function vivo() { return document.body.contains(cv); }

    // ---- le misure: il campo visto dall'alto (un po' inclinato, come in Pokémon e Stardew): tutti i quadrati grandi uguali ----
    //      in alto, tra l'intestazione e il campo, le rovine, la tenda e la professoressa (in piedi); in basso i consigli e i tasti
    var cw = 360, ch = 640, dpr = 1, G = {}, sfondo = null;
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      cw = s.clientWidth || 360; ch = s.clientHeight || 640; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      var giu = ch - 140, su = 50 + Math.max(78, ch * .13), INC = .9;   // INC: quanto il campo è schiacciato (la vista inclinata)
      var cell = Math.min((cw - 20) / N, (giu - su) / (N * INC)), cellH = cell * INC;
      G = { cell: cell, cellH: cellH, x0: (cw - N * cell) / 2, y0: giu - N * cellH };
      G.yH = Math.max(40, G.y0 - Math.max(70, (G.y0 - 50) * .8)); G.av = cell * 1.95; sfondo = null;
    }
    window.addEventListener("resize", misura);
    function proj(u, v) { return { x: G.x0 + u * G.cell, y: G.y0 + v * G.cellH, k: G.cell / 44 }; }

    // ---- gli avatar: il tuo (col badile) e la professoressa vicino alla tenda ----
    function immagine(cfg, o) { var im = new Image(); try { im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, o || {})); } catch (e) {} return im; }
    var mio = opts.omino && window.SGOmino ? opts.omino : (window.SGOmino ? SGOmino.casuale("Esploratore") : null);
    var imFermo = mio ? immagine(mio) : null, imPasso = mio ? immagine(mio, { cammina: true }) : null;
    var cfgProf = null, imProf = null;
    if (window.SGOmino) { cfgProf = SGOmino.casuale("Ida"); cfgProf.cappello = "cowboy"; cfgProf.occhiali = "tondi"; cfgProf.colCap = 6; cfgProf = SGOmino.norm(cfgProf); imProf = immagine(cfgProf); }
    var av = { u: N / 2, v: N - .25, tu: 0, tv: 0, stato: "fermo", t: 0, lato: 1, cella: null, colpo: 0 };
    var particelle = [], scossa = 0, occupato = false, tLuce = 0;

    // ---- toccare il campo ----
    function cellaIn(x, y) { var c = Math.floor((x - G.x0) / G.cell), r = Math.floor((y - G.y0) / G.cellH); return r >= 0 && c >= 0 && r < N && c < N ? { r: r, c: c } : null; }
    cv.addEventListener("pointerdown", function (e) {
      if (occupato || fossa.classList.contains("su") || sopra.classList.contains("su")) return;
      var b = cv.getBoundingClientRect(), q = cellaIn(e.clientX - b.left, e.clientY - b.top); if (!q) return;
      var v = st(q.r, q.c);
      if (v === 1) { dimmi("Qui hai già visto che non c'è niente ❌"); vibra(8); return; }
      if (v) return;
      if (colpi() <= 0) { finitiColpi(); return; }
      if (!rimasti()) { dimmi("Oggi hai già trovato tutto! Domani il campo è nuovo 🌅"); return; }
      vibra(12); vaiAScavare(q);
    });
    function vaiAScavare(q) {
      occupato = true; av.cella = q;
      av.lato = q.c >= N - 1 ? -1 : 1;   // si mette a destra del quadrato (a sinistra se è l'ultimo)
      av.tu = q.c + .5 + av.lato * .95; av.tv = q.r + .62; av.stato = "cammina"; av.t = 0;
    }
    function colpoDiPala() {   // il badile entra nella terra: polvere, scossa, suono
      var p = proj(av.cella.c + .5, av.cella.r + .5); suonoPala(); scossa = 4;
      for (var i = 0; i < 14; i++) particelle.push({ x: p.x, y: p.y, vx: (Math.random() - .5) * 3.4 * p.k * 2, vy: -Math.random() * 3.6 - 1.2, v: 1, r: (1.5 + Math.random() * 2.6) * p.k * 1.6, col: Math.random() < .5 ? "#c7955c" : "#e6c08a" });
    }
    function esitoScavo() {   // finito di scavare: cosa c'era?
      var q = av.cella, r = q.r, c = q.c, p = nascostoIn(r, c);
      usaColpo(); aggTesta();
      if (p) {
        metti(r, c, 4); D.inCorso = { r: r, c: c, id: p.id }; salva(); suonoTrovato(); vibra(25);
        parla(PER_ID[p.id].r >= 4 ? "Incredibile… questo sembra un pezzo importantissimo! Pennello e tanta calma." : "C'è qualcosa! Ora tiralo fuori con calma: il piccone fa franare la terra.");
        setTimeout(function () { apriFossa(p.id); }, 700);
        return;
      }
      if (vicini(r, c) === 0) {   // niente qui intorno: le ❌ su tutto il quadrato attorno
        metti(r, c, 5); var k = 0;
        for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) { var a = r + dr, b = c + dc; if ((dr || dc) && a >= 0 && b >= 0 && a < N && b < N && st(a, b) === 0) { (function (a, b, k) { setTimeout(function () { metti(a, b, 1); suonoX(); }, 60 + k * 50); })(a, b, k++); } }
        parla("Niente qui intorno. Cambia zona: lontano dalle ❌.");
      } else { metti(r, c, 2); suonoSi(); parla("Fuochino! In uno degli 8 quadrati attorno alla bandierina c'è qualcosa."); }
      salva(); occupato = false;
      if (colpi() <= 0 && rimasti()) setTimeout(finitiColpi, 900);
    }

    // ---- l'animazione: avatar che cammina e scava, polvere ----
    function aggiorna(dt) {
      tLuce += dt;
      if (av.stato === "cammina") {
        var du = av.tu - av.u, dv = av.tv - av.v, d = Math.sqrt(du * du + dv * dv), passo = 5.5 * dt;
        av.t += dt;
        if (d <= passo) { av.u = av.tu; av.v = av.tv; av.stato = "scava"; av.t = 0; av.colpo = 0; }
        else { av.u += du / d * passo; av.v += dv / d * passo; }
      } else if (av.stato === "scava") {
        av.t += dt;
        if (av.colpo === 0 && av.t > .34) { av.colpo = 1; colpoDiPala(); }
        if (av.colpo === 1 && av.t > .72) { av.colpo = 2; colpoDiPala(); }
        if (av.t > 1.0) { av.stato = "fermo"; av.t = 0; esitoScavo(); }
      }
      particelle.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += .32; p.v -= .03; });
      particelle = particelle.filter(function (p) { return p.v > 0; });
      scossa = Math.max(0, scossa - dt * 18);
    }

    // ---- il paesaggio fermo: cielo, colline, rovine, la tenda (si disegna una volta) ----
    var FASE = fase();
    var PAL = {
      giorno: { c0: "#5aa9e6", c1: "#bfe3f5", c2: "#fbe9c6", coll: "#d9b77e", coll2: "#c79d5e", terra0: "#e8cd98", terra1: "#cfa565", campo: "#b9874d", pietra: "#efe4cc", tenda: "#f4ead2", buio: 0 },
      tramonto: { c0: "#4a3a8a", c1: "#e98a6e", c2: "#ffcf8a", coll: "#b98761", coll2: "#9a6a4a", terra0: "#d9a876", terra1: "#b9824f", campo: "#a5723f", pietra: "#e6c9a8", tenda: "#f1d2b0", buio: .1 },
      notte: { c0: "#070b24", c1: "#1b2550", c2: "#3a3f6e", coll: "#3b3550", coll2: "#2c2840", terra0: "#8a7f86", terra1: "#6b5e5c", campo: "#6a5644", pietra: "#a9a4bb", tenda: "#c4bfd2", buio: .18 }
    };
    function pal() { return PAL[FASE] || PAL.giorno; }
    function disegnaSfondo() {
      var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height;
      var x = c.getContext("2d"), P = pal(), r = rnd(777), i, yH = G.yH, y0 = G.y0, fw = N * G.cell, fh = N * G.cellH, x0 = G.x0, k = G.cell / 44;
      x.scale(dpr, dpr); x.lineJoin = "round"; x.lineCap = "round";
      // il cielo in cima (dietro l'intestazione), il sole o la luna, le colline lontane
      var g = x.createLinearGradient(0, 0, 0, yH + 10); g.addColorStop(0, P.c0); g.addColorStop(.7, P.c1); g.addColorStop(1, P.c2); x.fillStyle = g; x.fillRect(0, 0, cw, yH + 20);
      if (FASE === "notte") { x.fillStyle = "#fff"; for (i = 0; i < 40; i++) { x.globalAlpha = .3 + r() * .7; x.beginPath(); x.arc(r() * cw, r() * yH * .95, r() * 1.2 + .3, 0, 6.29); x.fill(); } x.globalAlpha = 1; x.fillStyle = "#f8f3d4"; x.beginPath(); x.arc(cw * .82, yH * .45, 12, 0, 6.29); x.fill(); }
      else { x.fillStyle = FASE === "tramonto" ? "#ffb35c" : "#fff4c2"; x.globalAlpha = .9; x.beginPath(); x.arc(cw * .82, yH * (FASE === "tramonto" ? .85 : .45), FASE === "tramonto" ? 20 : 15, 0, 6.29); x.fill(); x.globalAlpha = 1; }
      function colline(yb, amp, f, ph, col) { x.fillStyle = col; x.beginPath(); x.moveTo(0, yb + 40); for (var xx = 0; xx <= cw; xx += 4) x.lineTo(xx, yb - Math.abs(Math.sin(xx / f + ph)) * amp - Math.sin(xx / (f * .43) + ph) * amp * .3); x.lineTo(cw, ch); x.lineTo(0, ch); x.closePath(); x.fill(); }
      colline(yH, 14, 70, .8, P.coll); colline(yH + 6, 8, 45, 2.4, P.coll2);
      // la sabbia: un po' più chiara lontano, più calda vicino, con sassolini sparsi
      g = x.createLinearGradient(0, yH + 6, 0, ch); g.addColorStop(0, P.terra0); g.addColorStop(1, P.terra1); x.fillStyle = g; x.fillRect(0, yH + 8, cw, ch);
      for (i = 0; i < 70; i++) { var sx = r() * cw, sy = yH + 14 + r() * (ch - yH - 14); x.fillStyle = "rgba(90,60,30," + (.08 + r() * .12) + ")"; x.beginPath(); x.ellipse(sx, sy, 2 + r() * 4, 1 + r() * 2, 0, 0, 6.29); x.fill(); }
      // tra il cielo e il campo: le rovine in piedi, i cipressi, il tavolo coi cocci e la tenda degli archeologi
      var base = y0 - 10 * k, alto = Math.max(30, base - yH - 4);
      function colonna(px, h, w, rotta) {
        x.fillStyle = "rgba(60,40,20,.18)"; x.beginPath(); x.ellipse(px + w * .3, base + 2, w * 1.1, w * .35, 0, 0, 6.29); x.fill();
        x.fillStyle = P.pietra; x.strokeStyle = "rgba(80,60,40,.5)"; x.lineWidth = 1.2;
        x.fillRect(px - w * .7, base - w * .35, w * 1.4, w * .35); x.strokeRect(px - w * .7, base - w * .35, w * 1.4, w * .35);
        x.beginPath(); x.moveTo(px - w / 2, base - w * .35); x.lineTo(px - w / 2, base - h); if (rotta) { x.lineTo(px - w * .1, base - h - w * .5); x.lineTo(px + w * .15, base - h + w * .3); } x.lineTo(px + w / 2, base - h + (rotta ? w * .2 : 0)); x.lineTo(px + w / 2, base - w * .35); x.closePath(); x.fill(); x.stroke();
        for (var f = -1; f <= 1; f++) { x.beginPath(); x.moveTo(px + f * w * .22, base - w * .4); x.lineTo(px + f * w * .22, base - h + w * .4); x.stroke(); }
        if (!rotta) { x.fillRect(px - w * .75, base - h - w * .3, w * 1.5, w * .3); x.strokeRect(px - w * .75, base - h - w * .3, w * 1.5, w * .3); }
      }
      function cipresso(px, h) { x.fillStyle = FASE === "notte" ? "#1c2a22" : "#3d6b3a"; x.beginPath(); x.moveTo(px, base - h); x.quadraticCurveTo(px + h * .18, base - h * .45, px + h * .07, base); x.lineTo(px - h * .07, base); x.quadraticCurveTo(px - h * .18, base - h * .45, px, base - h); x.fill(); }
      var cs2 = Math.max(8, cw * .025);
      cipresso(cw * .05, alto * .95); cipresso(cw * .955, alto * .85);
      colonna(cw * .13, alto * .82, cs2, false); colonna(cw * .22, alto * .5, cs2 * .9, true); colonna(cw * .31, alto * .7, cs2 * .85, false);
      // l'arco
      x.fillStyle = P.pietra; x.strokeStyle = "rgba(80,60,40,.5)"; var ax = cw * .47, aw = Math.min(cw * .15, alto * 1.2), ah = alto * .6;
      x.beginPath(); x.moveTo(ax - aw / 2, base); x.lineTo(ax - aw / 2, base - ah); x.lineTo(ax + aw / 2, base - ah); x.lineTo(ax + aw / 2, base); x.lineTo(ax + aw * .28, base); x.lineTo(ax + aw * .28, base - ah * .55); x.arc(ax, base - ah * .55, aw * .28, 0, Math.PI, true); x.lineTo(ax - aw * .28, base); x.closePath(); x.fill(); x.stroke();
      // la tenda a righe, con la bandierina
      var tx = cw * .8, tw = Math.min(cw * .24, alto * 1.5), th = Math.min(tw * .62, alto * .85);
      x.fillStyle = "rgba(0,0,0,.15)"; x.beginPath(); x.ellipse(tx, base + 2, tw * .62, 6, 0, 0, 6.29); x.fill();
      x.fillStyle = P.tenda; x.strokeStyle = "#8a6a3a"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(tx - tw / 2, base); x.lineTo(tx, base - th); x.lineTo(tx + tw / 2, base); x.closePath(); x.fill(); x.stroke();
      x.globalAlpha = .55; x.fillStyle = "#c4452f"; for (i = 0; i < 3; i++) { var a1 = (i * 2 + 1) / 6, a2 = (i * 2 + 2) / 6; x.beginPath(); x.moveTo(tx - tw / 2 + tw * a1 / 2, base - th * a1); x.lineTo(tx - tw / 2 + tw * a2 / 2, base - th * a2); x.lineTo(tx - tw / 2 + tw * a2 / 2 + 3, base); x.lineTo(tx - tw / 2 + tw * a1 / 2 + 3, base); x.closePath(); x.fill(); } x.globalAlpha = 1;
      x.fillStyle = "#4a2e18"; x.beginPath(); x.moveTo(tx - tw * .14, base); x.lineTo(tx, base - th * .62); x.lineTo(tx + tw * .14, base); x.closePath(); x.fill();
      x.strokeStyle = "#5a3a22"; x.lineWidth = 2; x.beginPath(); x.moveTo(tx, base - th); x.lineTo(tx, base - th - 10); x.stroke(); x.fillStyle = "#e03131"; x.beginPath(); x.moveTo(tx, base - th - 10); x.lineTo(tx + 9, base - th - 7); x.lineTo(tx, base - th - 4); x.fill();
      // il tavolino coi cocci e il setaccio, a sinistra del campo
      var mx = Math.max(24, x0 + 18), mb = base; x.fillStyle = "#8b5a2b"; x.fillRect(mx - 16, mb - 12, 32, 4); x.fillRect(mx - 13, mb - 8, 3, 8); x.fillRect(mx + 10, mb - 8, 3, 8);
      x.fillStyle = "#c8673a"; x.beginPath(); x.ellipse(mx - 6, mb - 16, 4, 5, 0, 0, 6.29); x.fill(); x.fillStyle = "#adb5bd"; x.beginPath(); x.ellipse(mx + 6, mb - 14, 7, 2.5, 0, 0, 6.29); x.fill();
      // il campo: più basso della sabbia intorno (il bordo in ombra in alto, la luce in basso)
      x.fillStyle = "rgba(70,40,15,.35)"; x.fillRect(x0 - 7, y0 - 7, fw + 14, fh + 14);
      x.fillStyle = P.campo; x.fillRect(x0 - 3, y0 - 3, fw + 6, fh + 6);
      g = x.createLinearGradient(0, y0 - 3, 0, y0 + 12); g.addColorStop(0, "rgba(40,20,5,.45)"); g.addColorStop(1, "rgba(40,20,5,0)"); x.fillStyle = g; x.fillRect(x0 - 3, y0 - 3, fw + 6, 15);
      x.fillStyle = "rgba(255,240,210,.35)"; x.fillRect(x0 - 7, y0 + fh + 3, fw + 14, 4);
      for (var rr2 = 0; rr2 < N; rr2++) for (var cc2 = 0; cc2 < N; cc2++) {   // ogni quadrato un po' diverso, con qualche sassolino
        var qx = x0 + cc2 * G.cell, qy = y0 + rr2 * G.cellH;
        x.fillStyle = (rr2 + cc2) % 2 ? "rgba(255,240,210,.07)" : "rgba(70,40,15,.07)"; x.fillRect(qx, qy, G.cell, G.cellH);
        for (var t2 = 0; t2 < 2; t2++) if (r() < .55) { x.fillStyle = "rgba(80,50,25," + (.2 + r() * .2) + ")"; x.beginPath(); x.ellipse(qx + G.cell * (.15 + r() * .7), qy + G.cellH * (.15 + r() * .7), (1.4 + r() * 1.8) * k * 1.4, (.9 + r()) * k * 1.4, 0, 0, 6.29); x.fill(); }
      }
      // lo spago e i picchetti
      x.strokeStyle = FASE === "notte" ? "rgba(230,220,200,.55)" : "rgba(255,248,230,.85)"; x.lineWidth = 1.3;
      for (i = 0; i <= N; i++) { x.beginPath(); x.moveTo(x0 + i * G.cell, y0); x.lineTo(x0 + i * G.cell, y0 + fh); x.moveTo(x0, y0 + i * G.cellH); x.lineTo(x0 + fw, y0 + i * G.cellH); x.stroke(); }
      for (i = 0; i <= N; i += 3) [[i, 0], [i, N], [0, i], [N, i]].forEach(function (t) {
        var p = proj(t[0], t[1]), h = 12 * k * 1.4, w = 3.2 * k * 1.4;
        x.fillStyle = "rgba(40,20,5,.3)"; x.beginPath(); x.ellipse(p.x + 2, p.y + 1, w * 1.2, w * .5, 0, 0, 6.29); x.fill();
        x.fillStyle = "#7a4a22"; x.fillRect(p.x - w / 2, p.y - h, w, h); x.fillStyle = "#e03131"; x.fillRect(p.x - w * .65, p.y - h, w * 1.3, w);
      });
      return c;
    }

    // ---- il disegno di ogni fotogramma ----
    function disegna() {
      if (!sfondo) sfondo = disegnaSfondo();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      var sx = scossa ? (Math.random() - .5) * scossa : 0, sy = scossa ? (Math.random() - .5) * scossa : 0;
      ctx.setTransform(dpr, 0, 0, dpr, dpr * sx, dpr * sy); ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.drawImage(sfondo, 0, 0, cw, ch);
      var spr = [], r, c;   // le cose in piedi (bandierine, avatar, professoressa): si disegnano dalla più lontana
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
        var v = st(r, c), a = proj(c, r), b = proj(c + 1, r), cc = proj(c + 1, r + 1), d = proj(c, r + 1), m = proj(c + .5, r + .5);
        if (v === 2 || v === 4 || v === 5) {   // la buca
          var bw = (b.x - a.x + cc.x - d.x) / 4 * .62, bh = (d.y - a.y) * .32;
          ctx.fillStyle = "rgba(40,22,10,.85)"; ctx.beginPath(); ctx.ellipse(m.x, m.y + bh * .1, bw, bh, 0, 0, 6.29); ctx.fill();
          ctx.strokeStyle = "rgba(255,230,190,.35)"; ctx.lineWidth = 1.5 * m.k * 1.5; ctx.beginPath(); ctx.ellipse(m.x, m.y + bh * .1, bw, bh, 0, Math.PI * .1, Math.PI * .9); ctx.stroke();
          ctx.fillStyle = "#a8763f"; ctx.beginPath(); ctx.ellipse(m.x + bw * 1.15, m.y - bh * .2, bw * .45, bh * .55, 0, 0, 6.29); ctx.fill();   // il mucchietto di terra
        }
        if (v === 1 || v === 5) {   // la ❌ dipinta per terra
          ctx.strokeStyle = "#d9412b"; ctx.lineWidth = Math.max(2, 4.2 * m.k); var t = .3;
          ctx.beginPath(); ctx.moveTo(a.x + (cc.x - a.x) * t, a.y + (cc.y - a.y) * t); ctx.lineTo(a.x + (cc.x - a.x) * (1 - t), a.y + (cc.y - a.y) * (1 - t));
          ctx.moveTo(b.x + (d.x - b.x) * t, b.y + (d.y - b.y) * t); ctx.lineTo(b.x + (d.x - b.x) * (1 - t), b.y + (d.y - b.y) * (1 - t)); ctx.stroke();
        }
        if (v === 4) {   // qui c'era un reperto: luccica
          ctx.fillStyle = "rgba(255,224,102," + (.5 + .3 * Math.sin(tLuce * 4 + r + c)) + ")"; ctx.beginPath(); ctx.arc(m.x, m.y - 2 * m.k, 4 * m.k * 1.6, 0, 6.29); ctx.fill();
        }
        if (v === 2) spr.push({ v: r + .5, f: bandierina.bind(null, m) });
        if (!v && indizio && indizio.r === r && indizio.c === c) {   // il coccio che spunta: un indizio
          ctx.fillStyle = "#c8673a"; ctx.strokeStyle = "#6b2f14"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(m.x - 6 * m.k * 1.5, m.y); ctx.lineTo(m.x - 1 * m.k, m.y - 5 * m.k * 1.5); ctx.lineTo(m.x + 6 * m.k * 1.5, m.y - 1); ctx.lineTo(m.x + 2 * m.k, m.y + 3 * m.k); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
      if (imProf) spr.push({ v: -1, f: function () { var k = G.cell / 44; figura(imProf, { x: cw * .64, y: G.y0 - 9 * k, k: k * .9 }, false, 0); } });   // la professoressa davanti alle rovine
      spr.push({ v: av.v, f: disegnaMio });
      spr.sort(function (x1, x2) { return x1.v - x2.v; }).forEach(function (o) { o.f(); });
      particelle.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.v); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill(); });
      ctx.globalAlpha = 1;
      if (pal().buio) { ctx.fillStyle = "rgba(10,14,40," + pal().buio + ")"; ctx.fillRect(-10, -10, cw + 20, ch + 20); var lp = { x: cw * .8, y: G.y0 }; var gl = ctx.createRadialGradient(lp.x, lp.y - 20, 4, lp.x, lp.y - 20, 120); gl.addColorStop(0, "rgba(255,210,120,.35)"); gl.addColorStop(1, "rgba(255,210,120,0)"); ctx.fillStyle = gl; ctx.fillRect(lp.x - 130, lp.y - 150, 260, 260); }
    }
    function bandierina(m) {
      var h = 30 * m.k * 1.6, w2 = 16 * m.k * 1.6;
      ctx.strokeStyle = "#5a3a22"; ctx.lineWidth = Math.max(1.5, 2.2 * m.k); ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x, m.y - h); ctx.stroke();
      ctx.fillStyle = "#2f9e44"; ctx.beginPath(); ctx.moveTo(m.x, m.y - h); ctx.lineTo(m.x + w2, m.y - h + w2 * .35); ctx.lineTo(m.x, m.y - h + w2 * .7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.2, 1.8 * m.k); ctx.beginPath(); ctx.moveTo(m.x + w2 * .18, m.y - h + w2 * .36); ctx.lineTo(m.x + w2 * .32, m.y - h + w2 * .5); ctx.lineTo(m.x + w2 * .55, m.y - h + w2 * .16); ctx.stroke();
    }
    function figura(im, p, specchio, giu) {   // un avatar in piedi in quel punto del campo (giu: quanto si piega)
      if (!im || !im.complete || !im.naturalWidth) return;
      var h = G.av * p.k, w = h / 1.32;
      ctx.fillStyle = "rgba(40,25,10,.25)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, w * .32, w * .1, 0, 0, 6.29); ctx.fill();
      ctx.save(); ctx.translate(p.x, p.y + (giu || 0) * h); if (specchio) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h * .96, w, h); ctx.restore();
    }
    function disegnaMio() {
      var p = proj(av.u, av.v), h = G.av * p.k, im = imFermo, giu = 0;
      if (av.stato === "cammina") { im = Math.floor(av.t * 6) % 2 ? imPasso : imFermo; p.y -= Math.abs(Math.sin(av.t * 18)) * h * .02; }
      var lato = av.lato, mano = { x: p.x + lato * h * .2, y: p.y - h * .42 }, riposo = { x: p.x + lato * h * .36, y: p.y - h * .02 }, punta = riposo;
      if (av.stato === "scava" && av.cella) {   // su… e giù dentro la terra, due volte
        var dove = proj(av.cella.c + .5, av.cella.r + .5), su = { x: p.x + lato * h * .42, y: p.y - h * .32 }, t = av.t;
        function tra(A, B, k) { k = Math.max(0, Math.min(1, k)); k = k * k * (3 - 2 * k); return { x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k }; }
        punta = t < .26 ? tra(riposo, su, t / .26) : t < .36 ? tra(su, dove, (t - .26) / .1) : t < .55 ? tra(dove, su, (t - .36) / .19) : t < .74 ? tra(su, dove, (t - .55) / .19) : tra(dove, riposo, (t - .74) / .26);
        giu = (t > .3 && t < .45) || (t > .68 && t < .82) ? .035 : 0;
        mano = { x: mano.x + (punta.x - mano.x) * .25, y: p.y - h * (.42 - giu) };
      }
      figura(im, p, lato < 0, giu);
      // il badile: il manico dalla mano alla punta, e la lama di ferro
      var dx = punta.x - mano.x, dy = punta.y - mano.y, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, lw = Math.max(1.6, h * .028);
      var top = { x: mano.x - ux * h * .12, y: mano.y - uy * h * .12 };
      ctx.strokeStyle = "#3b2414"; ctx.lineWidth = lw + 2; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(punta.x - ux * h * .08, punta.y - uy * h * .08); ctx.stroke();
      ctx.strokeStyle = "#a0652b"; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(punta.x - ux * h * .08, punta.y - uy * h * .08); ctx.stroke();
      var bl = h * .1, bw = h * .055, px = -uy, py = ux, base = { x: punta.x - ux * bl, y: punta.y - uy * bl };
      ctx.fillStyle = "#adb5bd"; ctx.strokeStyle = "#495057"; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(base.x + px * bw, base.y + py * bw); ctx.lineTo(base.x - px * bw, base.y - py * bw); ctx.lineTo(punta.x - px * bw * .6, punta.y - py * bw * .6); ctx.quadraticCurveTo(punta.x + ux * bw * .4, punta.y + uy * bw * .4, punta.x + px * bw * .6, punta.y + py * bw * .6); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    var anim = 0, ult = 0;
    function giro(o) {
      if (!vivo()) return;
      var dt = Math.min(.05, (o - ult) / 1000 || 0); ult = o;
      aggiorna(dt); disegna(); anim = requestAnimationFrame(giro);
    }

    // =========================================================
    //  L'ESTRAZIONE: la terra a quadretti, piccone e pennello, la frana
    // =========================================================
    var W = 12, H = 9, cs = 30, strati = [], sassi = [], ogg = [], frana = 0, attrezzo = "piccone", finita = true, schegge = [], tremo = 0, fragile = 14, peso = 1, animF = 0;
    var fTela = el("canvas", "sv-ftela"), fx = fTela.getContext("2d"), fTesta = el("div", "sv-fintesta"), fFaccia = el("img", "sv-faccia"), fTit = el("div", "sv-ftit");
    var fBarre = el("div", "sv-barre"), bFrana = el("i"), bInt = el("i"), fAttr = el("div", "sv-attrezzi"), tPicc = el("button", "sv-attrezzo"), tPenn = el("button", "sv-attrezzo"), fBasta = el("button", "sv-basta", "Basta così: porto via quello che è già fuori");
    fFaccia.alt = ""; fTesta.appendChild(fFaccia); fTesta.appendChild(fTit);
    (function () {
      var a = el("div", "sv-barra sv-frana"); a.appendChild(document.createTextNode("Frana")); var ia = el("span"); ia.appendChild(bFrana); a.appendChild(ia);
      var b = el("div", "sv-barra sv-intatto"); b.appendChild(document.createTextNode("Reperto intatto")); var ib = el("span"); ib.appendChild(bInt); b.appendChild(ib);
      fBarre.appendChild(a); fBarre.appendChild(b);
      tPicc.innerHTML = "<span>⛏️</span><b>Piccone</b><small>veloce, ma fa franare</small>"; tPenn.innerHTML = "<span>🖌️</span><b>Pennello</b><small>piano e sicuro</small>";
      fAttr.appendChild(tPicc); fAttr.appendChild(tPenn);
    })();
    [fTesta, fTela, fBarre, fAttr, fBasta].forEach(function (n) { fossa.appendChild(n); });
    var facce = {};
    function faccia(k) {   // la tua faccia mentre scavi: tranquilla, contenta, preoccupata
      if (!mio || !window.SGOmino) return;
      if (!facce[k]) { var c2 = JSON.parse(JSON.stringify(mio)); if (k === "si") c2.bocca = "risata"; if (k === "no") c2.bocca = "nervoso"; try { facce[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(c2, { busto: true })); } catch (e) { facce[k] = ""; } }
      if (fFaccia.getAttribute("src") !== facce[k]) fFaccia.src = facce[k];
    }
    function scegliAttrezzo(t) { attrezzo = t; tPicc.classList.toggle("on", t === "piccone"); tPenn.classList.toggle("on", t === "pennello"); vibra(8); }
    tPicc.onclick = function () { scegliAttrezzo("piccone"); }; tPenn.onclick = function () { scegliAttrezzo("pennello"); };
    fBasta.onclick = function () { if (!finita) chiudiFossa(false); };
    function liberi(o) { return o.celle.every(function (q) { return strati[q[1] * W + q[0]] <= 0; }); }
    function principale() { return ogg.filter(function (o) { return o.princ; })[0]; }
    function oggettoIn(x, y) { return ogg.filter(function (o) { return o.celle.some(function (q) { return q[0] === x && q[1] === y; }); })[0]; }
    function sasso(x, y) { return sassi.some(function (z) { return z[0] === x && z[1] === y; }); }
    function apriFossa(id) {
      var lv = PER_ID[id].r - 1, R = rnd(hash(oggi() + id + Math.random()));
      fragile = 10 + lv * 5; peso = 1 + lv * .12; frana = 0; schegge = []; finita = false;
      fTit.innerHTML = "<b>Tira fuori il reperto</b><small>Vicino ai pezzi usa il pennello</small>";
      var largo = Math.min(cw - 24, 440); cs = Math.floor(largo / W);
      var d2 = Math.min(2, window.devicePixelRatio || 1); fTela.width = W * cs * d2; fTela.height = H * cs * d2; fTela.style.width = W * cs + "px"; fTela.style.height = H * cs + "px"; fx.setTransform(d2, 0, 0, d2, 0, 0);
      strati = []; for (var i = 0; i < W * H; i++) strati.push(Math.min(4, 2 + Math.floor(R() * 3) - (R() < .25 ? 1 : 0) + (lv >= 3 && R() < .5 ? 1 : 0)));
      sassi = []; ogg = [];
      function libero(x, y, w, h) { for (var yy = y - 1; yy <= y + h; yy++) for (var xx = x - 1; xx <= x + w; xx++) { if (oggettoIn(xx, yy) || sasso(xx, yy)) return false; } return true; }
      function piazza(t, princ) {
        var m = PER_ID[t].m, h = m.length, w = m[0].length;
        for (var k = 0; k < 300; k++) {
          var x = (princ ? 2 : 0) + Math.floor(R() * (W - w - (princ ? 4 : 0) + 1)), y = (princ ? 1 : 0) + Math.floor(R() * (H - h - (princ ? 2 : 0) + 1));
          if (!libero(x, y, w, h)) continue;
          var cel = []; m.forEach(function (riga, yy) { riga.split("").forEach(function (ch2, xx) { if (ch2 === "X") cel.push([x + xx, y + yy]); }); });
          ogg.push({ id: t, x: x, y: y, w: w, h: h, celle: cel, integro: 100, princ: princ, fuori: false }); return;
        }
      }
      piazza(id, true); if (R() < .45) piazza(PICCOLI[Math.floor(R() * PICCOLI.length)], false);
      for (var s2 = 0; s2 < 3 + lv; s2++) for (var t2 = 0; t2 < 60; t2++) { var sx = Math.floor(R() * W), sy = Math.floor(R() * H); if (libero(sx, sy, 1, 1)) { sassi.push([sx, sy]); if (R() < .6 && sx + 1 < W && libero(sx + 1, sy, 1, 1)) sassi.push([sx + 1, sy]); break; } }
      ogg.forEach(function (o) { o.celle.forEach(function (q) { strati[q[1] * W + q[0]] = Math.max(strati[q[1] * W + q[0]], lv >= 2 ? 3 : 2); }); });   // i reperti non stanno mai in superficie
      scegliAttrezzo("piccone"); faccia("ok"); aggBarre();
      fossa.classList.add("su"); cancelAnimationFrame(animF); animF = requestAnimationFrame(disegnaFossa);
    }
    function aggBarre() { bFrana.style.width = Math.min(100, frana) + "%"; var p = principale(); bInt.style.width = (p ? p.integro : 0) + "%"; }
    function colpisci(x, y) {
      if (finita || x < 0 || y < 0 || x >= W || y >= H) return;
      var forte = attrezzo === "piccone";
      if (sasso(x, y)) { suonoTok(); frana += forte ? 6 : 2; tremo = 4; scheggia(x, y, "#9a968e", 6); dimmi("Tok! È un sasso: non si rompe, giraci intorno"); return fine2(); }
      function togli(xx, yy, n) {
        if (xx < 0 || yy < 0 || xx >= W || yy >= H || sasso(xx, yy)) return;
        var i = yy * W + xx, o = oggettoIn(xx, yy);
        if (strati[i] <= 0) { if (o && forte && n >= 2) { o.integro = Math.max(0, o.integro - fragile); suonoCrepa(); vibra(30); faccia("no"); dimmi("Crack! Col piccone hai crepato il reperto"); } return; }
        strati[i] = Math.max(0, strati[i] - n);
      }
      togli(x, y, forte ? 2 : 1);
      if (forte) { togli(x + 1, y, 1); togli(x - 1, y, 1); togli(x, y + 1, 1); togli(x, y - 1, 1); }
      frana += (forte ? 4.2 : 1.4) * peso; tremo = forte ? 3 : 0;
      if (forte) suonoTerra(); else suonoPennello();
      vibra(forte ? 10 : 5); scheggia(x, y, forte ? "#c7955c" : "#e3c08e", forte ? 9 : 4);
      ogg.forEach(function (o) { if (!o.fuori && liberi(o)) { o.fuori = true; suonoSi(); faccia("si"); if (!o.princ) dimmi("Sorpresa! Nella buca c'era anche: " + PER_ID[o.id].nome); } });
      if (frana > 75 && !finita) faccia("no");
      fine2();
    }
    function fine2() {
      aggBarre();
      if (ogg.every(function (o) { return liberi(o); })) return chiudiFossa(false);
      if (frana >= 100) { suonoFrana(); tremo = 14; vibra(80); return chiudiFossa(true); }
    }
    function scheggia(x, y, col, n) { for (var i = 0; i < n; i++) schegge.push({ x: (x + .5) * cs, y: (y + .5) * cs, vx: (Math.random() - .5) * 5, vy: -Math.random() * 4 - 1, v: 1, col: col, r: 1.5 + Math.random() * 2.5 }); }
    fTela.addEventListener("pointerdown", function (e) { var b = fTela.getBoundingClientRect(); colpisci(Math.floor((e.clientX - b.left) / cs), Math.floor((e.clientY - b.top) / cs)); });
    var TERRA = ["#5a3a22", "#8a5a33", "#a8733f", "#c48f55", "#d9aa6c"];
    function disegnaFossa() {
      if (!fossa.classList.contains("su") || !vivo()) return;
      var ox2 = tremo ? (Math.random() - .5) * tremo : 0, oy2 = tremo ? (Math.random() - .5) * tremo : 0; tremo = Math.max(0, tremo - .6);
      fx.save(); fx.clearRect(0, 0, W * cs, H * cs); fx.translate(ox2, oy2);
      var g = fx.createLinearGradient(0, 0, 0, H * cs); g.addColorStop(0, "#4a2f1a"); g.addColorStop(1, "#2f1d10"); fx.fillStyle = g; fx.fillRect(-10, -10, W * cs + 20, H * cs + 20);
      ogg.forEach(function (o) { disegnaReperto(fx, o.id, o.x * cs, o.y * cs, o.w * cs, o.h * cs, o.integro); });
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        var i = y * W + x, sv = strati[i];
        if (sasso(x, y)) {
          fx.fillStyle = "#8d8a84"; fx.strokeStyle = "#55524c"; fx.lineWidth = 2; fx.beginPath(); if (fx.roundRect) fx.roundRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4, 7); else fx.rect(x * cs + 2, y * cs + 2, cs - 4, cs - 4); fx.fill(); fx.stroke();
          fx.fillStyle = "rgba(255,255,255,.25)"; fx.beginPath(); fx.arc(x * cs + cs * .35, y * cs + cs * .35, cs * .12, 0, 6.29); fx.fill(); continue;
        }
        if (sv <= 0) continue;
        fx.fillStyle = TERRA[Math.min(4, sv)]; fx.fillRect(x * cs, y * cs, cs + .5, cs + .5);
        fx.fillStyle = "rgba(0,0,0,.12)"; for (var k = 0; k < 3; k++) { fx.beginPath(); fx.arc(x * cs + cs * seme01(i, k), y * cs + cs * seme01(i, k + 5), 1.4 + seme01(i, k + 9) * 1.6, 0, 6.29); fx.fill(); }
        fx.fillStyle = "rgba(255,255,255,.08)"; fx.fillRect(x * cs, y * cs, cs, 2);
      }
      schegge.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += .35; p.v -= .035; fx.globalAlpha = Math.max(0, p.v); fx.fillStyle = p.col; fx.beginPath(); fx.arc(p.x, p.y, p.r, 0, 6.29); fx.fill(); });
      fx.globalAlpha = 1; schegge = schegge.filter(function (p) { return p.v > 0; });
      if (frana >= 100) { fx.fillStyle = "rgba(90,58,33,.6)"; fx.fillRect(0, 0, W * cs, H * cs); }
      fx.restore();
      animF = requestAnimationFrame(disegnaFossa);
    }
    function chiudiFossa(franata) {
      finita = true; aggBarre();
      var presi = ogg.filter(function (o) { return liberi(o); });
      D.inCorso = null; salva();
      setTimeout(function () { fossa.classList.remove("su"); cancelAnimationFrame(animF); occupato = false; cartaReperto(presi, franata); }, franata ? 1000 : 550);
    }

    // ---- la carta del reperto: lo vendi o lo tieni ----
    function svuota() { while (sopra.firstChild) sopra.removeChild(sopra.firstChild); }
    function chiudiSopra() { sopra.classList.remove("su"); }
    function finestra(titolo, nodi, tasti, cls) {
      svuota(); var box = el("div", "sv-carta" + (cls ? " " + cls : "")); if (titolo) box.appendChild(el("h2", null, titolo));
      nodi.forEach(function (n) { if (n) box.appendChild(n); });
      var tt = el("div", "sv-tasti"); tasti.forEach(function (x) { var b = el("button", "btn " + (x.cls || "btn-fantasma"), x.testo); b.onclick = x.fn; if (x.off) b.disabled = true; tt.appendChild(b); }); box.appendChild(tt);
      sopra.appendChild(box); sopra.classList.add("su");
    }
    function nelMuseo(o) {   // il primo di ogni tipo entra nel museo; si ricorda il più intatto
      var a = D.album[o.id], nuovo = !a;
      D.album[o.id] = { n: (a ? a.n : 0) + 1, top: Math.max(a ? a.top : 0, o.integro) };
      D.tot++;
      EPOCHE.forEach(function (ep) {   // epoca completa: il premio, una volta sola
        if (D.premi[ep.id]) return;
        if (REPERTI.filter(function (x) { return x.epoca === ep.id; }).every(function (x) { return D.album[x.id]; })) { D.premi[ep.id] = 1; if (opts.cambia) opts.cambia(PREMIO_EPOCA); setTimeout(function () { dimmi("🏛️ " + ep.nome + " completa! +🪙 " + cifre(PREMIO_EPOCA)); suonoMonete(); }, 900); }
      });
      return nuovo;
    }
    function cartaReperto(presi, franata) {
      var p = presi.filter(function (o) { return o.princ; })[0], extra = presi.filter(function (o) { return !o.princ; });
      var nodi = [], nuovi = {};
      presi.forEach(function (o) { nuovi[o.id] = nelMuseo(o); });
      if (p) {
        var R = PER_ID[p.id], fig = el("div", "sv-fig r" + R.r); fig.appendChild(tela(p.id, 150, p.integro)); nodi.push(fig);
        var rar = el("span", "sv-rar", RARITA[R.r]); rar.style.background = COL_R[R.r]; nodi.push(rar);
        nodi.push(el("div", "sv-epoca", EPOCHE.filter(function (e) { return e.id === R.epoca; })[0].nome + " · " + R.quando));
        nodi.push(el("p", "sv-stato", p.integro >= 100 ? "Intatto! Perfetto per il museo 🏛️" : p.integro >= 60 ? "Un po' crepato (" + p.integro + "%)" : "Molto crepato (" + p.integro + "%): vale meno"));
        if (nuovi[p.id]) nodi.push(el("div", "sv-nuovo", "✨ Nuovo nel museo!"));
        suonoCarta(R.r);
      } else nodi.push(el("p", "sv-frase", franata ? "La terra è franata e il reperto è rimasto sepolto. Col pennello la frana sale più piano." : "Il reperto è rimasto sotto terra."));
      if (extra.length) { var l = el("div", "sv-extra"); extra.forEach(function (o) { l.appendChild(el("span", null, "🎁 " + PER_ID[o.id].nome)); }); nodi.push(l); }
      if (franata && p) nodi.push(el("p", "sv-nota", "È franato tutto: hai tenuto quello che era già fuori."));
      var tot = presi.reduce(function (a, o) { return a + valoreDi(o.id, o.integro); }, 0);
      var tasti = [];
      if (presi.length) {
        tasti.push({ testo: "🪙 Vendi tutto · " + cifre(tot), cls: "btn-primario", fn: function () { if (opts.cambia) opts.cambia(tot); suonoMonete(); vibra(10); chiudiSopra(); salva(); aggTesta(); dopoCarta(); } });
        tasti.push({ testo: "🎒 Tieni nello zaino", off: D.zaino.length + presi.length > ZAINO_MAX, fn: function () { presi.forEach(function (o) { D.zaino.push({ id: o.id, integro: o.integro }); }); chiudiSopra(); salva(); aggTesta(); dopoCarta(); } });
      } else tasti.push({ testo: "Va bene", cls: "btn-primario", fn: function () { chiudiSopra(); dopoCarta(); } });
      finestra(p ? PER_ID[p.id].nome : "Sepolto!", nodi, tasti);
      salva();
    }
    function dopoCarta() {
      if (!rimasti()) parla("Oggi hai trovato tutto quello che c'era! Domani il campo è nuovo.");
      else if (colpi() <= 0) finitiColpi();
      else parla((opts.illimitati ? "Colpi illimitati ⛏️." : "Ti restano " + colpi() + " colpi.") + " Ci sono ancora " + rimasti() + " cose sepolte qui.");
    }

    // ---- museo, zaino, colpi ----
    function museo() {
      var nodi = [el("p", "sv-frase", "Il primo di ogni reperto entra nel museo. Completa un'epoca: +🪙 " + cifre(PREMIO_EPOCA) + ".")], tot = 0;
      EPOCHE.forEach(function (ep) {
        var lista = REPERTI.filter(function (x) { return x.epoca === ep.id; }), presi = lista.filter(function (x) { return D.album[x.id]; }).length; tot += presi;
        nodi.push(el("div", "sv-sottot", ep.ico + " " + ep.nome + " · " + presi + "/" + lista.length + (D.premi[ep.id] ? " ✓" : "")));
        var g = el("div", "sv-album");
        lista.forEach(function (x) {
          var a = D.album[x.id], v = el("div", "sv-voce r" + x.r + (a ? "" : " buio"));
          v.appendChild(tela(x.id, 54, a ? a.top : null, !a)); v.appendChild(el("b", null, a ? x.nome : "???")); v.appendChild(el("small", null, a ? RARITA[x.r] + (a.top < 100 ? " · " + a.top + "%" : " · intatto") : RARITA[x.r]));
          g.appendChild(v);
        });
        nodi.push(g);
      });
      finestra("🏛️ Museo · " + tot + "/" + REPERTI.length, nodi, [{ testo: "Chiudi", cls: "btn-primario", fn: chiudiSopra }], "sv-lista");
    }
    function zaino() {
      var nodi = [];
      if (!D.zaino.length) nodi.push(el("p", "sv-frase", "Lo zaino è vuoto. I reperti che tieni finiscono qui: li puoi vendere quando vuoi."));
      var l = el("div", "sv-zaino"), tot = 0;
      D.zaino.forEach(function (o, i) {
        var v = valoreDi(o.id, o.integro); tot += v;
        var r = el("div", "sv-riga"); r.appendChild(tela(o.id, 34, o.integro)); r.appendChild(el("span", null, PER_ID[o.id].nome + (o.integro < 100 ? " (" + o.integro + "%)" : "")));
        var b = el("button", "sv-vendi", "🪙 " + cifre(v)); b.onclick = function () { D.zaino.splice(i, 1); if (opts.cambia) opts.cambia(v); suonoMonete(); vibra(10); salva(); aggTesta(); zaino(); }; r.appendChild(b);
        l.appendChild(r);
      });
      nodi.push(l);
      finestra("🎒 Zaino" + (D.zaino.length ? " · " + D.zaino.length + "/" + ZAINO_MAX : ""), nodi, [
        { testo: "Vendi tutto · 🪙 " + cifre(tot), cls: "btn-primario", off: !D.zaino.length, fn: function () { if (opts.cambia) opts.cambia(tot); D.zaino = []; suonoMonete(); salva(); aggTesta(); chiudiSopra(); dimmi("Venduto tutto! +🪙 " + cifre(tot)); } },
        { testo: "Chiudi", fn: chiudiSopra }], "sv-lista");
    }
    function compraColpi() {
      var ok = monete() >= PACCO.prezzo;
      finestra("⛏️ Colpi", [el("p", "sv-frase", "Ogni giorno hai " + COLPI_GIORNO + " colpi gratis (tornano a mezzanotte). Ne hai ancora " + colpi() + ".")],
        [{ testo: "Compra " + PACCO.n + " colpi · 🪙 " + cifre(PACCO.prezzo), cls: "btn-primario", off: !ok, fn: function () { if (monete() < PACCO.prezzo) return; if (opts.cambia) opts.cambia(-PACCO.prezzo); D.extra += PACCO.n; salva(); suonoMonete(); aggTesta(); chiudiSopra(); dimmi("+" + PACCO.n + " colpi ⛏️"); } },
         { testo: "Chiudi", fn: chiudiSopra }]);
    }
    function finitiColpi() {
      var ok = monete() >= PACCO.prezzo;
      finestra("Colpi finiti ⛏️", [el("p", "sv-frase", "Per oggi i " + COLPI_GIORNO + " colpi gratis sono finiti: tornano a mezzanotte, col campo nuovo." + (rimasti() ? " Qui sotto ci sono ancora " + rimasti() + " cose sepolte…" : ""))],
        [{ testo: "Compra " + PACCO.n + " colpi · 🪙 " + cifre(PACCO.prezzo), cls: "btn-primario", off: !ok, fn: function () { if (monete() < PACCO.prezzo) return; if (opts.cambia) opts.cambia(-PACCO.prezzo); D.extra += PACCO.n; salva(); suonoMonete(); aggTesta(); chiudiSopra(); } },
         { testo: "Va bene", fn: chiudiSopra }]);
    }

    function chiudi() { cancelAnimationFrame(anim); cancelAnimationFrame(animF); window.removeEventListener("resize", misura); }
    function esci() {
      if (fossa.classList.contains("su") && !finita) { dimmi("Finisci prima di tirare fuori il reperto (o tocca \"Basta così\")"); return; }
      chiudi(); salva(); if (opts.indietro) opts.indietro();
    }
    s._monta = function () {
      misura(); aggTesta();
      if (D.inCorso && st(D.inCorso.r, D.inCorso.c) === 4) { occupato = true; parla("Avevi lasciato un reperto a metà: tiriamolo fuori!"); setTimeout(function () { apriFossa(D.inCorso.id); }, 500); }
      else if (!rimasti()) parla("Oggi hai già trovato tutto! Domani il campo è nuovo.");
      else if (!D.tot) parla("Tocca un quadrato e il tuo avatar scava. ❌ = niente intorno, ✅ = qualcosa vicino.");
      else parla(colpi() > 0 ? "Bentornato! " + (opts.illimitati ? "Per te i colpi sono illimitati. " : "Hai " + colpi() + " colpi. ") + (indizio && !st(indizio.r, indizio.c) ? "Vedi quel coccio per terra? Lì vicino c'è qualcosa." : "Scava dove vuoi.") : "Colpi finiti per oggi: tornano a mezzanotte.");
      anim = requestAnimationFrame(function (o) { ult = o; giro(o); });
    };
    s._chiudi = chiudi;
    window.__scavi = { D: D, nascosti: nascosti, av: av, scava: function (r, c) { vaiAScavare({ r: r, c: c }); }, colpisci: colpisci, fossa: function (id) { apriFossa(id); }, ogg: function () { return ogg; }, avanza: function (sec) { for (var i = 0; i < sec * 60; i++) aggiorna(1 / 60); } };   // (per le prove)
    return s;
  }

  // ---------- lo stile (una volta sola, prefisso sv-) ----------
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.sv-vista{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;position:relative;background:#e8cd98;user-select:none;-webkit-user-select:none}",
      ".sv-tela{position:absolute;inset:0;width:100%;height:100%;touch-action:none}",
      ".sv-testa{position:absolute;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:3;display:flex;align-items:center;gap:6px}",
      ".sv-tasto{flex:none;width:38px;height:38px;border:0;border-radius:12px;cursor:pointer;font:inherit;font-size:1.3rem;font-weight:900;color:#fff;background:rgba(58,38,22,.55)}",
      ".sv-nome{flex:1;min-width:0;font-weight:900;font-size:1.02rem;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sv-chip{flex:none;height:34px;padding:0 10px;border-radius:12px;display:flex;align-items:center;font-weight:900;font-size:.92rem;color:#fff;background:rgba(58,38,22,.6)}",
      ".sv-giu{position:absolute;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:3;display:flex;gap:8px;justify-content:center}",
      ".sv-bott{flex:1;max-width:160px;height:44px;border:0;border-radius:14px;cursor:pointer;font:inherit;font-weight:900;font-size:.92rem;color:#fff;background:rgba(58,38,22,.66);box-shadow:inset 0 0 0 1.5px rgba(255,236,200,.35)}",
      ".sv-prof{position:absolute;left:10px;right:10px;bottom:calc(62px + env(safe-area-inset-bottom));z-index:3;margin:0 auto;max-width:420px;padding:6px 12px 7px;border-radius:14px;font-weight:800;font-size:.8rem;line-height:1.28;color:#3a2616;background:rgba(255,248,234,.94);box-shadow:0 4px 12px rgba(0,0,0,.2),inset 0 0 0 2px #c9a46e;pointer-events:none}",
      ".sv-prof b{display:block;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:#9a6a3c}",
      ".sv-prof.su{animation:svProf .35s cubic-bezier(.3,1.5,.5,1)}@keyframes svProf{from{transform:scale(.92);opacity:.4}}",
      ".sv-avviso{position:absolute;left:50%;top:calc(54px + env(safe-area-inset-top));z-index:5;transform:translateX(-50%);max-width:92%;padding:8px 14px;border-radius:999px;text-align:center;font-weight:900;font-size:.88rem;color:#3a2200;background:#ffe066;box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;pointer-events:none}",
      ".sv-avviso.su{animation:svAvv 2.6s ease forwards}@keyframes svAvv{0%{opacity:0;transform:translate(-50%,8px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}82%{opacity:1}100%{opacity:0}}",
      ".sv-fossa{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:calc(12px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom));background:radial-gradient(ellipse at 50% 30%,#6b4a2c,#2b1a0e);opacity:0;pointer-events:none;transition:opacity .3s}",
      ".sv-fossa.su{opacity:1;pointer-events:auto}",
      ".sv-fintesta{display:flex;align-items:center;gap:10px;width:100%;max-width:440px;color:#fff3d6}",
      ".sv-faccia{width:52px;height:52px;border-radius:50%;background:#f6e7c8;box-shadow:0 0 0 3px #c9a46e;object-fit:cover}",
      ".sv-ftit b{display:block;font-weight:900;font-size:1.05rem}.sv-ftit small{font-weight:700;font-size:.78rem;color:#e9c98e}",
      ".sv-ftela{display:block;border-radius:10px;box-shadow:0 0 0 3px #4a2e18,0 6px 0 #1f130a,inset 0 0 20px rgba(0,0,0,.4);touch-action:manipulation}",
      ".sv-barre{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:440px}",
      ".sv-barra{padding:6px 8px;border-radius:10px;background:#fff8ea;font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#3a2616}",
      ".sv-barra span{display:block;height:10px;margin-top:4px;border-radius:6px;background:#e3d3b4;overflow:hidden}.sv-barra i{display:block;height:100%;width:0;border-radius:6px;transition:width .2s}",
      ".sv-frana i{background:linear-gradient(90deg,#e3b23c,#d4572e)}.sv-intatto i{background:linear-gradient(90deg,#6cbf5a,#3f9c4a)}",
      ".sv-attrezzi{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:440px}",
      ".sv-attrezzo{display:flex;flex-direction:column;align-items:center;gap:1px;padding:7px 6px;border:3px solid #5b3a21;border-radius:14px;cursor:pointer;font:inherit;color:#3a2616;background:#fff8ea;box-shadow:0 4px 0 #5b3a21}",
      ".sv-attrezzo span{font-size:1.5rem;line-height:1}.sv-attrezzo b{font-size:.95rem}.sv-attrezzo small{font-size:.68rem;font-weight:700;color:#9a6a3c}",
      ".sv-attrezzo.on{background:#ffe08a;transform:translateY(2px);box-shadow:0 2px 0 #5b3a21}",
      ".sv-basta{border:0;background:none;cursor:pointer;font:inherit;font-weight:800;font-size:.85rem;color:#f6e7c8;text-decoration:underline}",
      ".sv-sopra{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(30,18,8,.55);opacity:0;pointer-events:none;transition:opacity .25s}",
      ".sv-sopra.su{opacity:1;pointer-events:auto}",
      ".sv-carta{width:100%;max-width:340px;max-height:calc(var(--alt,100dvh) - 40px);overflow:auto;padding:16px 14px;border-radius:20px;text-align:center;color:#3a2616;background:#fff8ea;box-shadow:0 10px 0 #5b3a21,0 18px 40px rgba(0,0,0,.45),inset 0 0 0 3px #c9a46e;animation:svGira .5s cubic-bezier(.3,1.4,.5,1)}",
      "@keyframes svGira{from{transform:rotateY(80deg) scale(.85);opacity:.3}}",
      ".sv-carta h2{margin:4px 0 6px;font-size:1.3rem;font-weight:900}",
      ".sv-fig{display:flex;justify-content:center;padding:6px 0;border-radius:50%;margin:0 auto;width:170px;background:radial-gradient(circle,#fff3d6,#ead2a4 70%,rgba(234,210,164,0) 72%)}",
      ".sv-fig.r4{background:radial-gradient(circle,#f3d9fa,#d0a4e6 70%,rgba(208,164,230,0) 72%)}.sv-fig.r5{background:radial-gradient(circle,#fff3bf,#f6c84c 70%,rgba(246,200,76,0) 72%)}",
      ".sv-rar{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:999px;font-weight:900;font-size:.75rem;color:#fff}",
      ".sv-epoca{margin-top:6px;font-weight:800;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#9a6a3c}",
      ".sv-stato{margin:8px 0 0;font-weight:800;font-size:.92rem}",
      ".sv-nuovo{margin-top:6px;font-weight:900;color:#2f9e44}",
      ".sv-extra{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px}.sv-extra span{padding:4px 9px;border-radius:999px;font-size:.78rem;font-weight:800;background:#f1e3c2}",
      ".sv-frase{margin:6px 0 0;font-size:.92rem;line-height:1.4;font-weight:700}",
      ".sv-nota{margin:8px 0 0;font-size:.78rem;font-weight:700;color:#9a6a3c}",
      ".sv-tasti{display:flex;flex-direction:column;gap:8px;margin-top:14px}",
      ".sv-carta .btn-fantasma{color:#5b3a21;background:#f6ead0;box-shadow:inset 0 0 0 2px #c9a46e}",
      ".sv-lista{max-width:380px}",
      ".sv-sottot{margin:12px 0 4px;font-weight:900;font-size:.85rem;color:#9a6a3c;text-align:left}",
      ".sv-album{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}",
      ".sv-voce{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 3px;border-radius:12px;background:#f6ead0;min-height:96px}",
      ".sv-voce.r3{box-shadow:inset 0 0 0 1.5px #1c7ed6}.sv-voce.r4{box-shadow:inset 0 0 0 1.5px #9c36b5}.sv-voce.r5{box-shadow:inset 0 0 0 2px #f59f00}",
      ".sv-voce b{font-size:.68rem;line-height:1.15}.sv-voce small{font-size:.6rem;line-height:1.2;color:#9a6a3c}.sv-voce.buio{opacity:.8}",
      ".sv-zaino{display:flex;flex-direction:column;gap:6px;margin-top:8px;text-align:left}",
      ".sv-riga{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:12px;background:#f6ead0;font-size:.85rem;font-weight:800}",
      ".sv-riga span{flex:1;min-width:0}",
      ".sv-vendi{flex:none;height:32px;padding:0 10px;border:0;border-radius:10px;cursor:pointer;font:inherit;font-weight:900;font-size:.8rem;color:#3a2200;background:#ffe066}"
    ].join("\n");
    document.head.appendChild(st);
  }

  window.SGScavi = { crea: crea, REPERTI: REPERTI, disegnaReperto: disegnaReperto, tela: tela };
})();
