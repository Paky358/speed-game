/* =========================================================
   SPeeD GAME — IL GIARDINO (fuori dalla casa, visto dall'alto e inclinato, come la città)
   La casa sta in mezzo al tuo terreno; il giardino è tutto intorno. L'avatar va dove tocchi
   (davanti quando viene verso di te, di spalle quando va verso il fondo).
   - Alberi da frutto che crescono in tempo vero (germoglio → alberello → albero → frutti), l'orto coi semi,
     fiori, decorazioni, vialetti. Le piante crescono solo se annaffiate (un'annaffiata vale 24 ore):
     senza acqua si fermano, ma non muoiono mai.
   - I frutti vanno nel cesto: si vendono (Speed Coins).
   - "Sistema": sposti, metti nel baule o rivendi a metà prezzo. "Vivaio": compri.
   - Tocchi la porta ed entri in casa (js/casa.js). Di notte le finestre e i lampioni si accendono.
   I disegni sono in js/giardino-arte.js (SGGiardinoArte): una mattonella è un rombo 100×50.
   SGGiardino.crea({ omino, nome, dati, daCasa, salva(dati), monete(), spendi(n), guadagna(n), audio, entraInCasa(), indietro() })
   ========================================================= */
(function () {
  "use strict";

  var ORA = 3600e3, ACQUA = 24 * ORA;   // un'annaffiata fa crescere per 24 ore
  var CASA = { c: 4, r: 4, n: 4, m: 4 };   // la casa al centro del terreno di partenza (12×12); la porta davanti a sinistra
  var PORTA = { u: 6, v: 8.45 };            // dove si ferma l'avatar per entrare
  var ALBERI = {
    melo:     { nome: "Melo",     prezzo: 600,  tot: 24 * ORA, periodo: 8 * ORA,  frutto: "mela",     n: 6 },
    limone:   { nome: "Limone",   prezzo: 800,  tot: 28 * ORA, periodo: 9 * ORA,  frutto: "limone",   n: 6 },
    arancio:  { nome: "Arancio",  prezzo: 900,  tot: 30 * ORA, periodo: 10 * ORA, frutto: "arancia",  n: 6 },
    ciliegio: { nome: "Ciliegio", prezzo: 1200, tot: 36 * ORA, periodo: 12 * ORA, frutto: "ciliegia", n: 12 }
  };
  var SEMI = {   // l'orto: prezzo del seme, quanto ci mette, quanti ne raccogli
    carota:   { nome: "Carote",    seme: 20, tot: 2 * ORA,  n: 3 },
    insalata: { nome: "Insalata",  seme: 30, tot: 4 * ORA,  n: 1 },
    pomodoro: { nome: "Pomodori",  seme: 40, tot: 6 * ORA,  n: 4 },
    fragola:  { nome: "Fragole",   seme: 60, tot: 8 * ORA,  n: 8 },
    zucca:    { nome: "Zucca",     seme: 80, tot: 12 * ORA, n: 1 }
  };
  var FRUTTI = {   // nome al singolare/plurale, emoji, quanto si vende uno
    mela: ["mela", "mele", "🍎", 12], limone: ["limone", "limoni", "🍋", 14], arancia: ["arancia", "arance", "🍊", 16], ciliegia: ["ciliegia", "ciliegie", "🍒", 7],
    carota: ["carota", "carote", "🥕", 15], insalata: ["insalata", "insalate", "🥬", 70], pomodoro: ["pomodoro", "pomodori", "🍅", 20], fragola: ["fragola", "fragole", "🍓", 12], zucca: ["zucca", "zucche", "🎃", 200]
  };
  // il vivaio: cosa si compra (t = tipo dell'oggetto, fp = mattonelle occupate, terra = si disegna sul prato e ci si cammina sopra)
  var NEGOZIO = [
    { cat: "Alberi", voci: Object.keys(ALBERI).map(function (k) { return { t: k, nome: ALBERI[k].nome, prezzo: ALBERI[k].prezzo, sotto: "frutti ogni " + Math.round(ALBERI[k].periodo / ORA) + " ore" }; }) },
    { cat: "Orto e fiori", voci: [
      { t: "orto", nome: "Aiuola dell'orto", prezzo: 150, sotto: "ci semini quello che vuoi" },
      { t: "fiori_rosso", nome: "Fiori rossi", prezzo: 80 }, { t: "fiori_giallo", nome: "Fiori gialli", prezzo: 80 },
      { t: "fiori_viola", nome: "Fiori viola", prezzo: 80 }, { t: "fiori_bianco", nome: "Fiori bianchi", prezzo: 80 },
      { t: "cespuglio", nome: "Cespuglio", prezzo: 120 }, { t: "siepe", nome: "Siepe", prezzo: 100 }, { t: "vaso", nome: "Vaso di terracotta", prezzo: 90 } ] },
    { cat: "Decorazioni", voci: [
      { t: "panchina", nome: "Panchina", prezzo: 350 }, { t: "lampione", nome: "Lampione", prezzo: 400, sotto: "di notte si accende" },
      { t: "fontana", nome: "Fontana", prezzo: 1500 }, { t: "altalena", nome: "Altalena", prezzo: 900 },
      { t: "barbecue", nome: "Barbecue", prezzo: 700 }, { t: "casetta_uccelli", nome: "Casetta per gli uccellini", prezzo: 250 },
      { t: "gnomo", nome: "Nano da giardino", prezzo: 200 }, { t: "cassetta_posta", nome: "Cassetta della posta", prezzo: 150 } ] },
    { cat: "Vialetti", voci: [
      { t: "vialetto", nome: "Vialetto di pietra", prezzo: 30, sotto: "una mattonella" }, { t: "ghiaia", nome: "Ghiaia", prezzo: 20, sotto: "una mattonella" } ] }
  ];
  var PREZZO = {}, NOME = {};
  NEGOZIO.forEach(function (g) { g.voci.forEach(function (v) { PREZZO[v.t] = v.prezzo; NOME[v.t] = v.nome; }); });
  var FP = { fontana: [2, 2], altalena: [2, 1], casa: [4, 4] };
  var TERRA = { vialetto: 1, ghiaia: 1 };
  var ALLARGA = [{ a: 16, prezzo: 2000 }, { a: 20, prezzo: 5000 }, { a: 24, prezzo: 10000 }];   // il terreno si allarga verso di te

  // ---------- attrezzi ----------
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }   // solo quando si tocca per scegliere
  function fase() { try { return window.SGCitta ? SGCitta.fase(new Date()) : "giorno"; } catch (e) { return "giorno"; } }
  function durata(ms) { var m = Math.ceil(ms / 60000); if (m < 60) return m + " min"; var h = Math.floor(m / 60), r = m % 60; return h + (h === 1 ? " ora" : " ore") + (r ? " e " + r + " min" : ""); }
  function fpDi(t) { return FP[t] || [1, 1]; }
  function datiIniziali() {
    var ogg = [], k = 0;
    function metti(t, c, r, x) { var o = { k: ++k, t: t, c: c, r: r }; for (var q in x || {}) o[q] = x[q]; ogg.push(o); }
    for (var r = 8; r < 12; r++) { metti("vialetto", 5, r); metti("vialetto", 6, r); }   // il vialetto dalla porta al cancello
    metti("melo", 2, 9, { cresci: 0, fr: 0, acqua: 0, agg: Date.now() });   // si parte poveri: un germoglio, un'aiuola, la cassetta della posta
    metti("orto", 9, 9, {});
    metti("cassetta_posta", 7, 11);
    return { v: 1, w: 12, h: 12, ogg: ogg, ultimo: k, baule: {}, cesto: {} };
  }

  // ---------- i suoni (piccoli, fatti col WebAudio) ----------
  var AUDIO = null;
  function suona(note, tipo, vol, dur) {
    var c = AUDIO && AUDIO(); if (!c) return;
    try { note.forEach(function (f, i) { var o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + i * (dur || .09);
      o.type = tipo || "triangle"; o.frequency.setValueAtTime(f, t0); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol || .12, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + (dur || .09) * 1.6);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + (dur || .09) * 1.8); }); } catch (e) {}
  }
  function suonoRaccolto() { suona([660, 880, 1100], "triangle", .12, .07); }
  function suonoMonete() { suona([1320, 1760, 1320, 1980], "square", .05, .05); }
  function suonoPosa() { suona([300, 220], "sine", .15, .06); }
  function suonoAcqua() {
    var c = AUDIO && AUDIO(); if (!c) return;
    try { var n = Math.floor(c.sampleRate * .6), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) * .5;
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = "bandpass"; f.frequency.value = 2400; g.gain.value = .25; s.connect(f); f.connect(g); g.connect(c.destination); s.start(); } catch (e) {}
  }

  // ---------- i disegni: dall'arte (SVG) a immagini pronte per il canvas ----------
  var cacheArte = {}, quandoPronta = null;   // quandoPronta: il giardino aperto si ridisegna quando arriva un disegno
  function arte(nome, opz) {
    var A = window.SGGiardinoArte, k = nome + (opz && opz.notte ? "|n" : "");
    if (cacheArte[k] !== undefined) return cacheArte[k];
    var inf = A && A.info ? A.info(nome) : null;
    if (!inf) { cacheArte[k] = null; return null; }
    var im = new Image(); im.onload = function () { if (quandoPronta) quandoPronta(); }; try { im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(A.svg(nome, opz || {})); } catch (e) { cacheArte[k] = null; return null; }
    return (cacheArte[k] = { im: im, info: inf });
  }

  // =========================================================
  //  LA SCHERMATA DEL GIARDINO
  // =========================================================
  function crea(opts) {
    stile();
    AUDIO = opts.audio || null;
    var D = opts.dati && opts.dati.v ? opts.dati : datiIniziali();
    D.ogg = D.ogg || []; D.baule = D.baule || {}; D.cesto = D.cesto || {}; D.w = D.w || 12; D.h = D.h || 12; D.ultimo = D.ultimo || D.ogg.length;
    var tSalva = null;
    function salva() { clearTimeout(tSalva); tSalva = setTimeout(function () { if (opts.salva) opts.salva(D); }, 400); }
    function monete() { return opts.monete ? opts.monete() : 0; }

    // ---- la crescita: conta solo il tempo "bagnato" (le 24 ore dopo ogni annaffiata) ----
    function bagnato(o, t0, t1) { if (!o.acqua || t1 <= t0) return 0; return Math.max(0, Math.min(t1, o.acqua + ACQUA) - Math.max(t0, o.acqua)); }
    function cresci(o, ora) {
      var A = ALBERI[o.t], dt = bagnato(o, o.agg || ora, ora); o.agg = ora;
      if (A) {
        o.cresci = o.cresci || 0; o.fr = o.fr || 0;
        if (o.cresci < A.tot) { var serve = A.tot - o.cresci; if (dt <= serve) o.cresci += dt; else { o.cresci = A.tot; o.fr = Math.min(A.periodo, o.fr + dt - serve); } }
        else o.fr = Math.min(A.periodo, o.fr + dt);
      } else if (o.t === "orto" && o.pianta) { o.cresci = Math.min(SEMI[o.pianta].tot, (o.cresci || 0) + dt); }
    }
    function cresciTutto() { var ora = Date.now(); D.ogg.forEach(function (o) { cresci(o, ora); }); }
    function stadio(o) {   // quale disegno: albero 0-3, orto 0-2
      var A = ALBERI[o.t];
      if (A) return o.cresci >= A.tot ? (o.fr >= A.periodo ? 3 : 2) : (o.cresci >= A.tot * .3 ? 1 : 0);
      if (o.t === "orto" && o.pianta) { var S = SEMI[o.pianta]; return o.cresci >= S.tot ? 2 : (o.cresci >= S.tot * .4 ? 1 : 0); }
      return 0;
    }
    function maturo(o) { return ALBERI[o.t] ? stadio(o) === 3 : (o.t === "orto" && o.pianta && stadio(o) === 2); }
    function sete(o) { if (!ALBERI[o.t] && !(o.t === "orto" && o.pianta && !maturo(o))) return false; if (ALBERI[o.t] && maturo(o)) return false; return !o.acqua || Date.now() > o.acqua + ACQUA; }
    function nomeArte(o) {
      if (ALBERI[o.t]) return "albero_" + o.t + "_" + stadio(o);
      if (o.t === "orto") return o.pianta ? "orto_" + o.pianta + "_" + stadio(o) : "orto";
      return o.t;
    }
    function manca(o) {   // quanto manca alla prossima cosa (per la scheda)
      var A = ALBERI[o.t];
      if (A) return o.cresci < A.tot ? A.tot - o.cresci : A.periodo - o.fr;
      if (o.t === "orto" && o.pianta) return SEMI[o.pianta].tot - (o.cresci || 0);
      return 0;
    }

    // ---- la griglia: chi occupa cosa ----
    function box(o) { var f = fpDi(o.t); return { c0: o.c, c1: o.c + f[0], r0: o.r, r1: o.r + f[1] }; }
    function occupato(c, r, salta) {   // c'è qualcosa che non si calpesta?
      if (c < 0 || r < 0 || c >= D.w || r >= D.h) return true;
      if (c >= CASA.c && c < CASA.c + CASA.n && r >= CASA.r && r < CASA.r + CASA.m) return true;
      for (var i = 0; i < D.ogg.length; i++) { var o = D.ogg[i]; if (o === salta || TERRA[o.t]) continue; var b = box(o); if (c >= b.c0 && c < b.c1 && r >= b.r0 && r < b.r1) return true; }
      return false;
    }
    function terraIn(c, r, salta) { for (var i = 0; i < D.ogg.length; i++) { var o = D.ogg[i]; if (o !== salta && TERRA[o.t] && o.c === c && o.r === r) return o; } return null; }
    function libero(t, c, r, salta) {   // si può mettere lì?
      var f = fpDi(t);
      for (var a = 0; a < f[0]; a++) for (var b = 0; b < f[1]; b++) {
        var cc = c + a, rr = r + b;
        if (TERRA[t]) { if (cc < 0 || rr < 0 || cc >= D.w || rr >= D.h || terraIn(cc, rr, salta)) return false; if (cc >= CASA.c && cc < CASA.c + CASA.n && rr >= CASA.r && rr < CASA.r + CASA.m) return false; }
        else if (occupato(cc, rr, salta)) return false;
      }
      if (!TERRA[t] && f[0] === 1 && f[1] === 1 && Math.floor(av.u) === c && Math.floor(av.v) === r) return false;   // non sopra l'avatar
      return true;
    }
    function oggettoIn(c, r) { for (var i = D.ogg.length - 1; i >= 0; i--) { var o = D.ogg[i], b = box(o); if (!TERRA[o.t] && c >= b.c0 && c < b.c1 && r >= b.r0 && r < b.r1) return o; } return null; }

    // ---- la struttura ----
    var s = el("div", "schermata gd-vista"), cv = el("canvas", "gd-tela"), ctx = cv.getContext("2d");
    var testa = el("div", "gd-testa"), bInd = el("button", "gd-tasto", "‹"), titolo = el("div", "gd-nome", "🏡 Il tuo giardino"), cMonete = el("div", "gd-chip");
    bInd.setAttribute("aria-label", "Torna in città"); bInd.onclick = function () { esci(); };
    [bInd, titolo, cMonete].forEach(function (n) { testa.appendChild(n); });
    var giu = el("div", "gd-giu"), bCasa = el("button", "gd-bott", "🏠 Casa"), bVivaio = el("button", "gd-bott", "🌱 Vivaio"), bSistema = el("button", "gd-bott", "✏️ Sistema"), bCesto = el("button", "gd-bott");
    bCasa.onclick = function () { vibra(10); vaiAllaPorta(); }; bVivaio.onclick = function () { vibra(10); vivaio(); }; bSistema.onclick = function () { vibra(10); modoSistema(!sistema); }; bCesto.onclick = function () { vibra(10); cesto(); };
    [bCasa, bVivaio, bSistema, bCesto].forEach(function (b) { giu.appendChild(b); });
    var barraSis = el("div", "gd-sis"), avviso = el("div", "gd-avviso"), sopra = el("div", "gd-sopra");
    [cv, testa, giu, barraSis, avviso, sopra].forEach(function (n) { s.appendChild(n); });
    function aggTesta() {
      cMonete.textContent = "🪙 " + cifre(monete());
      var n = 0; for (var k in D.cesto) n += D.cesto[k]; bCesto.textContent = "🧺 Cesto" + (n ? " (" + n + ")" : "");
    }
    function dimmi(t) { avviso.textContent = t; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    function vivo() { return document.body.contains(cv); }

    // ---- la telecamera: il terreno si sposta col dito e si ingrandisce con due dita ----
    var cw = 360, ch = 640, dpr = 1, zoom = 1, TW = 64, ox = 0, oy = 0, sfondo = null, sporco = true;
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      var pw = cw, ph = ch;
      cw = s.clientWidth || 360; ch = s.clientHeight || 640; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      TW = Math.round(Math.min(cw / 6.2, 76) * zoom);
      if (!misura.fatta) { misura.fatta = true; centra(CASA.c + 2, CASA.r + 3); } else { ox += (cw - pw) / 2; oy += (ch - ph) / 2; }
      sfondo = null; sporco = true;
    }
    window.addEventListener("resize", misura);
    function proj(c, r) { return { x: ox + (c - r) * TW / 2, y: oy + (c + r) * TW / 4 }; }
    function griglia(x, y) { var a = (x - ox) / (TW / 2), b = (y - oy) / (TW / 4); return { c: (a + b) / 2, r: (b - a) / 2 }; }
    function centra(c, r) { ox = cw / 2 - (c - r) * TW / 2; oy = ch * .52 - (c + r) * TW / 4; }
    function limita() {   // il terreno non scappa via dallo schermo
      var su = proj(0, 0), dx = proj(D.w, 0), sx = proj(0, D.h), gi = proj(D.w, D.h);
      if (dx.x < cw * .35) ox += cw * .35 - dx.x; if (sx.x > cw * .65) ox -= sx.x - cw * .65;
      if (gi.y < ch * .45) oy += ch * .45 - gi.y; if (su.y > ch * .55) oy -= su.y - ch * .55;
    }
    function zooma(z, cx, cy) {
      var nz = Math.max(.6, Math.min(1.7, z)); if (nz === zoom) return;
      var g = griglia(cx, cy); zoom = nz; TW = Math.round(Math.min(cw / 6.2, 76) * zoom);
      var p = proj(g.c, g.r); ox += cx - p.x; oy += cy - p.y; limita(); sfondo = null; sporco = true;
    }

    // ---- l'avatar: davanti quando viene verso di te, di spalle quando va verso il fondo ----
    function immagine(cfg, o) { var im = new Image(); try { im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, o || {})); } catch (e) {} im.onload = function () { sporco = true; }; return im; }
    var mio = opts.omino && window.SGOmino ? opts.omino : (window.SGOmino ? SGOmino.casuale(opts.nome || "Io") : null);
    var IM = mio ? { davanti: [immagine(mio), immagine(mio, { cammina: true })], dietro: [immagine(mio, { spalle: true }), immagine(mio, { spalle: true, cammina: true })] } : null;
    var av = { u: PORTA.u, v: PORTA.v, strada: [], t: 0, dietro: false, specchio: false, fa: null, ft: 0, poi: null };
    if (opts.daCasa) { av.fa = "esce"; av.strada = [{ u: PORTA.u, v: PORTA.v + .9 }]; }   // esci dalla porta e fai un passo nel giardino
    else { av.u = 5.9; av.v = D.h + .6; av.strada = [{ u: 5.9, v: D.h - 1.4 }]; }       // dalla città: arrivi dal marciapiede ed entri dal cancello

    // la strada più corta tra le mattonelle (anche in diagonale, senza tagliare gli angoli)
    function strada(da, versoLista) {
      var W = D.w, H = D.h, key = function (c, r) { return r * W + c; }, prec = {}, coda = [da], vista = {}; vista[key(da.c, da.r)] = 1;
      var obiettivi = {}; versoLista.forEach(function (q) { obiettivi[key(q.c, q.r)] = q; });
      while (coda.length) {
        var q = coda.shift(), kq = key(q.c, q.r);
        if (obiettivi[kq]) { var p = [q]; while (prec[kq] != null) { kq = prec[kq]; p.unshift({ c: kq % W, r: Math.floor(kq / W) }); } return p; }
        [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) {
          var c = q.c + d[0], r = q.r + d[1], k2 = key(c, r);
          if (c < 0 || r < 0 || c >= W || r >= H || vista[k2]) return;
          if (occupato(c, r) && !obiettivi[k2]) return;
          if (d[0] && d[1] && (occupato(q.c + d[0], q.r) || occupato(q.c, q.r + d[1]))) return;
          vista[k2] = 1; prec[k2] = kq; coda.push({ c: c, r: r });
        });
      }
      return null;
    }
    function vaiA(lista, poi, ultimo) {   // lista di mattonelle buone come arrivo; ultimo = un punto preciso dove fermarsi dopo
      var da = { c: Math.max(0, Math.min(D.w - 1, Math.floor(av.u))), r: Math.max(0, Math.min(D.h - 1, Math.floor(av.v))) };
      var p = strada(da, lista.filter(function (q) { return !occupato(q.c, q.r); }));
      if (!p) { dimmi("Da qui non ci arrivo 🤔"); return false; }
      av.strada = p.slice(1).map(function (q) { return { u: q.c + .5, v: q.r + .5 }; });
      if (ultimo) av.strada.push(ultimo);
      av.poi = poi || null; av.fa = null; sporco = true; return true;
    }
    function intorno(o) {   // le mattonelle libere attaccate a un oggetto
      var b = box(o), l = [];
      for (var c = b.c0 - 1; c <= b.c1; c++) for (var r = b.r0 - 1; r <= b.r1; r++) if (c < b.c0 || c >= b.c1 || r < b.r0 || r >= b.r1) l.push({ c: c, r: r });
      return l;
    }
    function vaiAllaPorta() { if (sistema) modoSistema(false); vaiA([{ c: 5, r: 8 }, { c: 6, r: 8 }], entra, { u: PORTA.u, v: PORTA.v }); }
    function entra() {   // l'avatar va verso la porta e svanisce: si entra in casa
      av.dietro = true; av.fa = "entra"; av.ft = 0; sporco = true; suona([392, 523], "sine", .1, .1);
      setTimeout(function () { chiudi(); salva(); if (opts.entraInCasa) opts.entraInCasa(); }, 650);
    }

    // ---- toccare: col dito che si muove si sposta il terreno; un tocco fermo sceglie ----
    var dita = {}, tocco = null, pinza = null;
    cv.addEventListener("pointerdown", function (e) {
      if (sopra.classList.contains("su")) return;
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      dita[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(dita);
      if (ids.length === 2) { var a = dita[ids[0]], b = dita[ids[1]]; pinza = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }; tocco = null; return; }
      var bb = cv.getBoundingClientRect();
      tocco = { x0: e.clientX, y0: e.clientY, x: e.clientX - bb.left, y: e.clientY - bb.top, mosso: false, ox: ox, oy: oy, trascina: null };
      if (sistema && scelto) { var o = cosaQui(tocco.x, tocco.y); if (o === scelto) tocco.trascina = { o: o, c: o.c, r: o.r }; }
    });
    cv.addEventListener("pointermove", function (e) {
      if (!dita[e.pointerId]) return;
      dita[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(dita);
      if (pinza && ids.length === 2) { var a = dita[ids[0]], b = dita[ids[1]], bb = cv.getBoundingClientRect(); zooma(pinza.z * Math.hypot(a.x - b.x, a.y - b.y) / pinza.d, (a.x + b.x) / 2 - bb.left, (a.y + b.y) / 2 - bb.top); return; }
      if (!tocco) return;
      var dx = e.clientX - tocco.x0, dy = e.clientY - tocco.y0;
      if (!tocco.mosso && Math.hypot(dx, dy) < 9) return;
      tocco.mosso = true;
      if (tocco.trascina) {   // sposto la cosa scelta: segue il dito, a scatti di mattonella
        var bb2 = cv.getBoundingClientRect(), g = griglia(e.clientX - bb2.left, e.clientY - bb2.top), f = fpDi(tocco.trascina.o.t);
        fantasma = { t: tocco.trascina.o.t, c: Math.floor(g.c - f[0] / 2 + .5), r: Math.floor(g.r - f[1] / 2 + .5), salta: tocco.trascina.o, o: tocco.trascina.o };
        sporco = true; return;
      }
      ox = tocco.ox + dx; oy = tocco.oy + dy; limita(); sporco = true;
    });
    function suSu(e) {
      delete dita[e.pointerId];
      if (pinza) { if (Object.keys(dita).length < 2) pinza = null; tocco = null; return; }
      var t = tocco; tocco = null; if (!t) return;
      if (t.trascina) {
        if (t.mosso && fantasma) { var ok = libero(fantasma.t, fantasma.c, fantasma.r, fantasma.salta); if (ok) { fantasma.o.c = fantasma.c; fantasma.o.r = fantasma.r; suonoPosa(); vibra(12); salva(); } else dimmi("Lì non ci sta 🚫"); }
        fantasma = null; sporco = true; if (t.mosso) return;
      }
      if (!t.mosso) tocca(t.x, t.y);
    }
    cv.addEventListener("pointerup", suSu); cv.addEventListener("pointercancel", suSu);
    cv.addEventListener("wheel", function (e) { e.preventDefault(); var bb = cv.getBoundingClientRect(); zooma(zoom * (e.deltaY < 0 ? 1.1 : .9), e.clientX - bb.left, e.clientY - bb.top); }, { passive: false });

    function cosaQui(x, y) {   // la cosa toccata: si guarda prima quella davanti (anche la chioma degli alberi)
      var l = ordinati.slice().reverse();
      for (var i = 0; i < l.length; i++) {
        var o = l[i].o; if (!o || TERRA[o.t]) continue;
        var R = l[i].ret; if (!R) continue;
        if (x >= R.x + R.w * .18 && x <= R.x + R.w * .82 && y >= R.y + R.h * .08 && y <= R.y + R.h) return o;
      }
      var g = griglia(x, y); return oggettoIn(Math.floor(g.c), Math.floor(g.r));
    }
    function tocca(x, y) {
      var g = griglia(x, y), c = Math.floor(g.c), r = Math.floor(g.r);
      if (posa) return posaQui(c, r);
      var o = cosaQui(x, y);
      if (sistema) { scegli(o && o.t !== "casa" ? o : null); return; }
      if (o && o.t === "casa") { vibra(10); return vaiAllaPorta(); }
      if (o) { vibra(10); return vaiAOggetto(o); }
      if (c >= CASA.c && c < CASA.c + CASA.n && r >= CASA.r && r < CASA.r + CASA.m) { vibra(10); return vaiAllaPorta(); }
      if (c < 0 || r < 0 || c >= D.w || r >= D.h) return;
      vibra(8); vaiA([{ c: c, r: r }], null, null);
    }
    function vaiAOggetto(o) {
      var l = intorno(o);
      l.sort(function (a, b) { return Math.hypot(a.c + .5 - av.u, a.r + .5 - av.v) - Math.hypot(b.c + .5 - av.u, b.r + .5 - av.v); });
      if (Math.floor(av.u) >= 0 && l.some(function (q) { return q.c === Math.floor(av.u) && q.r === Math.floor(av.v); })) { girati(o); return azione(o); }
      vaiA(l, function () { girati(o); azione(o); }, null);
    }
    function girati(o) { var b = box(o), cx = (b.c0 + b.c1) / 2, cy = (b.r0 + b.r1) / 2, dc = cx - av.u, dr = cy - av.v; av.dietro = dc + dr < 0; av.specchio = dc - dr < 0; sporco = true; }

    // ---- cosa si fa con le piante ----
    function azione(o) {
      cresciTutto();
      if (ALBERI[o.t] || (o.t === "orto" && o.pianta)) {
        if (maturo(o)) return raccogli(o);
        if (sete(o)) return annaffia(o);
        return scheda(o);
      }
      if (o.t === "orto") return semina(o);
      if (o.t === "fontana") { suonoAcqua(); return dimmi("Che bel rumore d'acqua 💦"); }
      if (o.t === "altalena") { av.fa = "dondola"; av.ft = 0; return dimmi("Wiiii! 🎠"); }
      if (o.t === "cassetta_posta") return dimmi("Nessuna lettera, per ora 📭");
      dimmi(NOME[o.t] || "");
    }
    function annaffia(o) {
      av.fa = "acqua"; av.ft = 0; av.su = o; suonoAcqua(); vibra(15);
      setTimeout(function () { cresci(o, Date.now()); o.acqua = Date.now(); o.agg = Date.now(); salva(); sporco = true;
        dimmi(ALBERI[o.t] ? "💧 Annaffiato! Ora cresce per 24 ore" : "💧 Annaffiato! Ora cresce"); }, 900);
    }
    function raccogli(o) {
      var A = ALBERI[o.t], f, n;
      if (A) { f = A.frutto; n = A.n; o.fr = 0; } else { f = o.pianta; n = SEMI[o.pianta].n; o.pianta = null; o.cresci = 0; o.acqua = 0; }
      D.cesto[f] = (D.cesto[f] || 0) + n; salva(); aggTesta(); suonoRaccolto(); vibra(20);
      var p = proj(o.c + fpDi(o.t)[0] / 2, o.r + fpDi(o.t)[1] / 2);
      for (var i = 0; i < Math.min(n, 8); i++) volano.push({ x: p.x + (Math.random() - .5) * TW * .5, y: p.y - TW * (A ? 1 : .3), vx: (Math.random() - .5) * 2, vy: -2.5 - Math.random() * 2, t: 0, e: FRUTTI[f][2] });
      dimmi("+" + n + " " + FRUTTI[f][2] + " " + (n === 1 ? FRUTTI[f][0] : FRUTTI[f][1]) + " nel cesto");
      av.fa = "raccogli"; av.ft = 0; sporco = true;
    }

    // ---- le finestre sopra (schede, vivaio, cesto, baule) ----
    function svuota() { while (sopra.firstChild) sopra.removeChild(sopra.firstChild); }
    function chiudiSopra() { sopra.classList.remove("su"); }
    function finestra(tit, nodi, tasti, cls) {
      svuota(); var box2 = el("div", "gd-carta" + (cls ? " " + cls : "")); if (tit) box2.appendChild(el("h2", null, tit));
      nodi.forEach(function (n) { if (n) box2.appendChild(n); });
      var tt = el("div", "gd-tasti"); (tasti || []).forEach(function (x) { var b = el("button", "btn " + (x.cls || "btn-fantasma"), x.testo); b.onclick = function () { vibra(10); x.fn(); }; if (x.off) b.disabled = true; tt.appendChild(b); }); box2.appendChild(tt);
      sopra.appendChild(box2); sopra.classList.add("su");
    }
    sopra.addEventListener("pointerdown", function (e) { if (e.target === sopra) chiudiSopra(); });
    function figura(nome, px) {   // un disegno dell'arte come immagine (per le schede)
      var A = window.SGGiardinoArte, i = el("img", "gd-fig"); i.alt = ""; i.style.width = i.style.height = px + "px";
      if (A && A.info(nome)) i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(A.svg(nome, {}));
      return i;
    }
    function scheda(o) {   // una pianta che sta crescendo: a che punto è
      var A = ALBERI[o.t], nodi = [figura(nomeArte(o), 120)];
      var nm = A ? A.nome : "Orto: " + SEMI[o.pianta].nome.toLowerCase();
      var stato = sete(o) ? "Ha sete: annaffiala e ricomincia a crescere." : A && o.cresci >= A.tot ? "I frutti saranno pronti tra " + durata(manca(o)) + "." : "Pronta tra " + durata(manca(o)) + (A ? " (poi fa i frutti)" : "") + ".";
      nodi.push(el("p", "gd-frase", stato));
      if (o.acqua && !sete(o)) nodi.push(el("p", "gd-nota", "💧 Annaffiata: cresce ancora per " + durata(o.acqua + ACQUA - Date.now())));
      finestra(nm, nodi, [{ testo: "Va bene", cls: "btn-primario", fn: chiudiSopra }]);
    }
    function semina(o) {   // l'aiuola vuota: scegli il seme
      var lista = el("div", "gd-griglia");
      Object.keys(SEMI).forEach(function (k) {
        var S = SEMI[k], b = el("button", "gd-voce");
        b.appendChild(figura("orto_" + k + "_2", 64)); b.appendChild(el("b", null, S.nome)); b.appendChild(el("small", null, "🪙 " + cifre(S.seme) + " · " + durata(S.tot)));
        if (monete() < S.seme) b.disabled = true;
        b.onclick = function () {
          if (monete() < S.seme) return; vibra(12); if (opts.spendi) opts.spendi(S.seme);
          o.pianta = k; o.cresci = 0; o.acqua = 0; o.agg = Date.now(); salva(); aggTesta(); chiudiSopra(); suonoPosa(); sporco = true;
          dimmi("Seminato! Ora annaffialo 💧"); setTimeout(function () { annaffia(o); }, 400);
        };
        lista.appendChild(b);
      });
      finestra("🌱 Cosa semini?", [lista, el("p", "gd-nota", "Le piante crescono solo se le annaffi. Poi raccogli e vendi dal cesto.")], [{ testo: "Chiudi", fn: chiudiSopra }], "gd-larga");
    }
    function cesto() {
      var nodi = [], tot = 0, l = el("div", "gd-righe");
      Object.keys(D.cesto).forEach(function (f) {
        var n = D.cesto[f]; if (!n) return; var v = n * FRUTTI[f][3]; tot += v;
        var r = el("div", "gd-riga"); r.appendChild(el("span", "gd-emo", FRUTTI[f][2])); r.appendChild(el("span", null, n + " " + (n === 1 ? FRUTTI[f][0] : FRUTTI[f][1])));
        var b = el("button", "gd-vendi", "🪙 " + cifre(v)); b.onclick = function () { vibra(10); if (opts.guadagna) opts.guadagna(v); D.cesto[f] = 0; suonoMonete(); salva(); aggTesta(); cesto(); };
        r.appendChild(b); l.appendChild(r);
      });
      if (!tot) nodi.push(el("p", "gd-frase", "Il cesto è vuoto. Quando gli alberi fanno i frutti, o l'orto è pronto, toccali per raccogliere."));
      else nodi.push(l);
      finestra("🧺 Il cesto", nodi, [
        { testo: "Vendi tutto · 🪙 " + cifre(tot), cls: "btn-primario", off: !tot, fn: function () { if (opts.guadagna) opts.guadagna(tot); D.cesto = {}; suonoMonete(); salva(); aggTesta(); chiudiSopra(); dimmi("Venduto tutto! +🪙 " + cifre(tot)); } },
        { testo: "Chiudi", fn: chiudiSopra }]);
    }
    var catVivaio = 0;
    function vivaio() {
      if (sistema) modoSistema(false);
      var schede = el("div", "gd-schede"), lista = el("div", "gd-griglia"), nodi = [schede, lista];
      NEGOZIO.concat([{ cat: "Terreno" }]).forEach(function (g, i) { var b = el("button", "gd-scheda" + (i === catVivaio ? " on" : ""), g.cat); b.onclick = function () { vibra(8); catVivaio = i; vivaio(); }; schede.appendChild(b); });
      var g = NEGOZIO[catVivaio];
      if (g) g.voci.forEach(function (v) {
        var b = el("button", "gd-voce"), nm = ALBERI[v.t] ? "albero_" + v.t + "_2" : v.t === "orto" ? "orto_carota_2" : v.t;
        b.appendChild(figura(nm, 64)); b.appendChild(el("b", null, v.nome)); b.appendChild(el("small", null, "🪙 " + cifre(v.prezzo) + (v.sotto ? " · " + v.sotto : "")));
        if (monete() < v.prezzo) b.classList.add("caro");
        b.onclick = function () {
          if (monete() < v.prezzo) { dimmi("Ti mancano 🪙 " + cifre(v.prezzo - monete())); return; }
          vibra(12); if (opts.spendi) opts.spendi(v.prezzo); D.baule[v.t] = (D.baule[v.t] || 0) + 1; salva(); aggTesta(); suonoMonete();
          chiudiSopra(); iniziaPosa(v.t);
        };
        lista.appendChild(b);
      });
      else {   // allargare il terreno
        var prossimo = ALLARGA.filter(function (a) { return a.a > D.w; })[0];
        nodi = [schede, el("p", "gd-frase", "Il tuo terreno è di " + D.w + " × " + D.h + " mattonelle."),
          prossimo ? el("p", "gd-nota", "Allargandolo diventa " + prossimo.a + " × " + prossimo.a + ": più spazio per alberi, orto e decorazioni.") : el("p", "gd-nota", "È già il più grande che c'è! 🏞️")];
        if (prossimo) return finestra("🌱 Vivaio", nodi, [{ testo: "Allarga · 🪙 " + cifre(prossimo.prezzo), cls: "btn-primario", off: monete() < prossimo.prezzo, fn: function () {
          if (monete() < prossimo.prezzo) return; if (opts.spendi) opts.spendi(prossimo.prezzo); D.w = D.h = prossimo.a; salva(); aggTesta(); suonoMonete(); chiudiSopra(); sfondo = null; sporco = true; dimmi("Terreno allargato! 🏞️"); } }, { testo: "Chiudi", fn: chiudiSopra }], "gd-larga");
      }
      finestra("🌱 Vivaio", nodi, [{ testo: "Chiudi", fn: chiudiSopra }], "gd-larga");
    }

    // ---- "Sistema": scegli, sposti col dito, metti nel baule o rivendi; e il baule per rimettere le cose ----
    var sistema = false, scelto = null, fantasma = null, posa = null, posaDaSis = false;   // posaDaSis: finito di posare si torna a "Sistema"
    function modoSistema(on) {
      sistema = on; scelto = null; posa = null; fantasma = null; sporco = true;
      s.classList.toggle("gd-sistema", on); bSistema.textContent = on ? "✅ Fatto" : "✏️ Sistema"; barraSistema();
    }
    function scegli(o) { scelto = o; sporco = true; barraSistema(); if (o) vibra(10); }
    function barraSistema() {
      while (barraSis.firstChild) barraSis.removeChild(barraSis.firstChild);
      barraSis.classList.toggle("su", sistema || !!posa);
      if (posa) { barraSis.appendChild(el("span", "gd-sis-t", TERRA[posa] ? "Tocca le mattonelle dove mettere: " + NOME[posa].toLowerCase() : "Tocca dove mettere: " + (NOME[posa] || "").toLowerCase()));
        var bF = el("button", "gd-sis-b", TERRA[posa] ? "✅ Fatto" : "✖ Annulla"); bF.onclick = function () { vibra(8); finePosa(); }; barraSis.appendChild(bF); return; }
      if (!sistema) return;
      if (!scelto) { barraSis.appendChild(el("span", "gd-sis-t", "Tocca una cosa per spostarla")); var bB = el("button", "gd-sis-b", "🎒 Baule" + (contaBaule() ? " (" + contaBaule() + ")" : "")); bB.onclick = function () { vibra(8); baule(); }; barraSis.appendChild(bB); return; }
      barraSis.appendChild(el("span", "gd-sis-t", (NOME[scelto.t] || "") + " · trascina col dito per spostare"));
      var bM = el("button", "gd-sis-b", "🎒"); bM.setAttribute("aria-label", "Nel baule");
      bM.onclick = function () { vibra(10); if (scelto.t === "orto" && scelto.pianta) { dimmi("Prima raccogli quello che c'è 🌱"); return; } togli(scelto); D.baule[scelto.t] = (D.baule[scelto.t] || 0) + 1; scegli(null); salva(); };
      var bV = el("button", "gd-sis-b", "🪙 " + cifre(Math.floor((PREZZO[scelto.t] || 0) / 2)));
      bV.onclick = function () {
        if (bV.dataset.sicuro !== "1") { bV.dataset.sicuro = "1"; bV.textContent = "Vendo? 🪙 " + cifre(Math.floor((PREZZO[scelto.t] || 0) / 2)); return; }
        vibra(12); if (opts.guadagna) opts.guadagna(Math.floor((PREZZO[scelto.t] || 0) / 2)); togli(scelto); suonoMonete(); scegli(null); salva(); aggTesta();
      };
      [bM, bV].forEach(function (b) { barraSis.appendChild(b); });
    }
    function togli(o) { D.ogg = D.ogg.filter(function (x) { return x !== o; }); sfondo = null; sporco = true; }
    function contaBaule() { var n = 0; for (var k in D.baule) n += D.baule[k]; return n; }
    function baule() {
      var lista = el("div", "gd-griglia");
      Object.keys(D.baule).forEach(function (t) {
        var n = D.baule[t]; if (!n) return;
        var b = el("button", "gd-voce"); b.appendChild(figura(ALBERI[t] ? "albero_" + t + "_0" : t, 64)); b.appendChild(el("b", null, NOME[t] || t)); b.appendChild(el("small", null, "× " + n));
        b.onclick = function () { vibra(10); chiudiSopra(); iniziaPosa(t); }; lista.appendChild(b);
      });
      finestra("🎒 Il baule", [contaBaule() ? lista : el("p", "gd-frase", "Il baule è vuoto. Le cose che compri o che togli dal giardino finiscono qui.")], [{ testo: "Chiudi", fn: chiudiSopra }], "gd-larga");
    }
    function finePosa() { posa = null; fantasma = null; sporco = true; if (posaDaSis) { posaDaSis = false; modoSistema(true); } else barraSistema(); }
    function iniziaPosa(t) { if (!D.baule[t]) return; posaDaSis = sistema; posa = t; scelto = null; sistema = false; s.classList.remove("gd-sistema"); bSistema.textContent = "✏️ Sistema"; barraSistema(); sporco = true; dimmi("Tocca dove metterlo 👇"); }
    function posaQui(c, r) {
      var f = fpDi(posa); c = c - Math.floor((f[0] - 1) / 2); r = r - Math.floor((f[1] - 1) / 2);
      if (!libero(posa, c, r)) { fantasma = { t: posa, c: c, r: r }; sporco = true; dimmi("Lì non ci sta 🚫"); vibra(30); return; }
      var o = { k: ++D.ultimo, t: posa, c: c, r: r };
      if (ALBERI[posa]) { o.cresci = 0; o.fr = 0; o.acqua = 0; o.agg = Date.now(); }
      D.ogg.push(o); D.baule[posa]--; if (!D.baule[posa]) delete D.baule[posa];
      suonoPosa(); vibra(15); salva(); fantasma = null; sfondo = TERRA[posa] ? null : sfondo; sporco = true;
      if (ALBERI[posa]) dimmi("Piantato! Annaffialo per farlo crescere 💧");
      if (!TERRA[posa] || !D.baule[posa]) return finePosa();
      barraSistema();
    }

    // ---- il disegno: il prato (fermo, in una tela a parte), poi le cose in piedi dalla più lontana ----
    var FASE = fase(), volano = [], tAnim = 0, ordinati = [];
    var PAL = { giorno: { fuori: "#7fb35a", fuori2: "#6fa34c", prato: "#95c962", prato2: "#8bbf58", buio: 0 },   // velo: il colore che si stende sopra a tutto la sera
      tramonto: { fuori: "#86a352", fuori2: "#7a9649", prato: "#9cbf5c", prato2: "#93b655", buio: .16, velo: "120,60,50" },
      notte: { fuori: "#557d4c", fuori2: "#4e7446", prato: "#6f9c57", prato2: "#689452", buio: .4, velo: "12,18,48" } };
    function pal() { return PAL[FASE] || PAL.giorno; }
    function disegnaSfondo() {
      var c = document.createElement("canvas"), W = D.w, H = D.h, pad = TW * 2;
      var L = (W + H) * TW / 2 + pad * 2, A = (W + H) * TW / 4 + pad * 2; c.width = Math.round(L * dpr); c.height = Math.round(A * dpr);
      var x = c.getContext("2d"), P = pal(), r = rnd(4242); x.scale(dpr, dpr);
      var o0 = { x: H * TW / 2 + pad, y: pad };   // dove sta l'angolo in alto del terreno dentro questa tela
      function pj(cc, rr) { return { x: o0.x + (cc - rr) * TW / 2, y: o0.y + (cc + rr) * TW / 4 }; }
      function rombo(cc, rr, n, m) { var a = pj(cc, rr), b = pj(cc + n, rr), d = pj(cc + n, rr + m), e = pj(cc, rr + m); x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.lineTo(d.x, d.y); x.lineTo(e.x, e.y); x.closePath(); }
      // il bordo del terreno (un gradino di terra) e il prato tagliato, a righe come un campo da calcio
      x.fillStyle = "rgba(60,40,20,.35)"; rombo(0, 0, W, H); x.save(); x.translate(0, TW * .12); x.fill(); x.restore();
      x.fillStyle = P.prato; rombo(0, 0, W, H); x.fill();
      for (var rr = 0; rr < H; rr++) { if (rr % 2) { x.fillStyle = P.prato2; rombo(0, rr, W, 1); x.fill(); } }
      for (var i = 0; i < W * H * 1.6; i++) {   // ciuffi d'erba e qualche fiorellino di campo
        var q = pj(r() * W, r() * H);
        if (r() < .08) { x.fillStyle = ["#fff", "#ffe066", "#f783ac"][Math.floor(r() * 3)]; x.globalAlpha = FASE === "notte" ? .35 : .85; x.beginPath(); x.arc(q.x, q.y, TW * .018 + .6, 0, 6.29); x.fill(); }
        else { x.strokeStyle = r() < .5 ? "rgba(40,90,30,.35)" : "rgba(220,255,180,.3)"; x.globalAlpha = 1; x.lineWidth = 1; x.beginPath(); x.moveTo(q.x, q.y); x.lineTo(q.x + (r() - .5) * 3, q.y - TW * .05); x.stroke(); }
      }
      x.globalAlpha = 1;
      // i vialetti e la ghiaia
      D.ogg.forEach(function (o) { if (!TERRA[o.t]) return; var a = arte(o.t); var ce = pj(o.c + .5, o.r + .5);
        if (a && a.im.complete && a.im.naturalWidth) { var k = TW / 100; x.drawImage(a.im, ce.x - a.info.ax * k, ce.y - a.info.ay * k, a.info.w * k, a.info.h * k); }
        else { x.fillStyle = o.t === "ghiaia" ? "#d8d2c4" : "#c9c2b4"; rombo(o.c + .06, o.r + .06, .88, .88); x.fill(); } });
      return { c: c, o0: o0, L: L, A: A };
    }
    // quale cosa sta davanti a quale (scatole a terra): A sta dietro a B se è tutta prima di B lungo uno dei due lati
    function dietroA(A, B) { return (A.c1 <= B.c0 + 1e-6 && A.r0 < B.r1 - 1e-6) || (A.r1 <= B.r0 + 1e-6 && A.c0 < B.c1 - 1e-6); }
    function ordina(lista) {
      var n = lista.length, prima = lista.map(function () { return []; }), conta = lista.map(function () { return 0; }), i, j;
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (i !== j && dietroA(lista[i].b, lista[j].b)) { prima[i].push(j); conta[j]++; }
      var pronti = [], out = [];
      for (i = 0; i < n; i++) if (!conta[i]) pronti.push(i);
      var chiave = function (k) { var b = lista[k].b; return b.c0 + b.r0 + b.c1 + b.r1; };
      while (pronti.length) {
        pronti.sort(function (a, b) { return chiave(a) - chiave(b); });
        var k = pronti.shift(); out.push(lista[k]);
        prima[k].forEach(function (m) { if (!--conta[m]) pronti.push(m); });
      }
      if (out.length < n) lista.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });   // per sicurezza
      return out;
    }
    function disegna() {
      var P = pal();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // il prato intorno (fuori dal terreno), a strisce morbide
      ctx.fillStyle = P.fuori; ctx.fillRect(0, 0, cw, ch);
      strada();   // fuori dal cancello: marciapiede e strada del quartiere
      if (!sfondo) sfondo = disegnaSfondo();
      ctx.drawImage(sfondo.c, ox - sfondo.o0.x, oy - sfondo.o0.y, sfondo.L, sfondo.A);
      vicini();   // dietro al recinto: gli alberi e le siepi dei vicini
      recinto(true);   // il recinto dietro (prima di tutto: davanti ci sono le cose)
      // le cose in piedi
      var lista = [], k = TW / 100;
      lista.push({ b: { c0: CASA.c, c1: CASA.c + CASA.n, r0: CASA.r, r1: CASA.r + CASA.m }, o: { t: "casa", c: CASA.c, r: CASA.r } });
      D.ogg.forEach(function (o) { if (TERRA[o.t]) return; if (fantasma && fantasma.o === o) return; lista.push({ b: box(o), o: o }); });
      if (fantasma && !TERRA[fantasma.t]) lista.push({ b: box(fantasma), o: fantasma, fantasma: true });
      lista.push({ b: { c0: av.u - .3, c1: av.u + .3, r0: av.v - .3, r1: av.v + .3 }, avatar: true });
      ordinati = ordina(lista);
      ordinati.forEach(function (x) {
        if (x.avatar) return disegnaAvatar();
        var o = x.o, f = fpDi(o.t), ce = proj(o.c + f[0] / 2, o.r + f[1] / 2), nome = o.t === "casa" ? "casa" : nomeArte(o);
        var a = arte(nome, { notte: FASE === "notte" && (o.t === "casa" || o.t === "lampione") });
        if (x.fantasma) ctx.globalAlpha = libero(o.t, o.c, o.r, o.salta) ? .65 : .3;
        if (sistema && scelto === o) { ctx.fillStyle = "rgba(255,224,102,.45)"; romboSchermo(o.c, o.r, f[0], f[1]); ctx.fill(); }
        if (a && a.im.complete && a.im.naturalWidth) { x.ret = { x: ce.x - a.info.ax * k, y: ce.y - a.info.ay * k, w: a.info.w * k, h: a.info.h * k }; ctx.drawImage(a.im, x.ret.x, x.ret.y, x.ret.w, x.ret.h); }
        else x.ret = segnaposto(o, ce, f);
        if (x.fantasma) { ctx.globalAlpha = 1; if (!libero(o.t, o.c, o.r, o.salta)) { ctx.fillStyle = "rgba(224,49,49,.35)"; romboSchermo(o.c, o.r, f[0], f[1]); ctx.fill(); } }
        if (!sistema && !x.fantasma && o.t !== "casa") bollina(o, ce, x.ret);
      });
      // il recinto davanti: sopra a tutto, perché davanti non c'è niente
      recinto(false);
      // i frutti che volano nel cesto
      volano.forEach(function (p) { ctx.globalAlpha = Math.max(0, 1 - p.t / 1.1); ctx.font = Math.round(TW * .3) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.e, p.x, p.y); });
      ctx.globalAlpha = 1;
      // la sera e la notte: tutto un po' più scuro, poi le luci calde sopra
      if (P.buio) {
        ctx.fillStyle = "rgba(" + P.velo + "," + P.buio + ")"; ctx.fillRect(0, 0, cw, ch);
        if (FASE !== "notte") return;   // le luci si accendono solo col buio
        ctx.globalCompositeOperation = "lighter";
        var luci = D.ogg.filter(function (o) { return o.t === "lampione"; }).map(function (o) { var p = proj(o.c + .5, o.r + .5); return { x: p.x, y: p.y - TW * .9, r: TW * 1.6 }; });
        var porta = proj(PORTA.u - .4, PORTA.v - .45); luci.push({ x: porta.x, y: porta.y - TW * .5, r: TW * 1.3 });
        luci.forEach(function (l) { var g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r); g.addColorStop(0, "rgba(255,190,90,.38)"); g.addColorStop(1, "rgba(255,190,90,0)"); ctx.fillStyle = g; ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); });
        ctx.globalCompositeOperation = "source-over";
      }
    }
    function romboSchermo(c, r, n, m) { var a = proj(c, r), b = proj(c + n, r), d = proj(c + n, r + m), e = proj(c, r + m); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(d.x, d.y); ctx.lineTo(e.x, e.y); ctx.closePath(); }
    function segnaposto(o, ce, f) {   // se l'arte non c'è ancora: forme semplici (non si vedono quasi mai)
      var k = TW / 100;
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(ce.x, ce.y, 34 * k * f[0], 14 * k * f[1], 0, 0, 6.29); ctx.fill();
      if (o.t === "casa") { ctx.fillStyle = "#f3d9b1"; ctx.fillRect(ce.x - 120 * k, ce.y - 150 * k, 240 * k, 140 * k); ctx.fillStyle = "#c4452f"; ctx.beginPath(); ctx.moveTo(ce.x - 140 * k, ce.y - 150 * k); ctx.lineTo(ce.x, ce.y - 240 * k); ctx.lineTo(ce.x + 140 * k, ce.y - 150 * k); ctx.fill(); return { x: ce.x - 140 * k, y: ce.y - 240 * k, w: 280 * k, h: 240 * k }; }
      if (ALBERI[o.t]) { var st = stadio(o), h = [30, 70, 110, 110][st] * k; ctx.fillStyle = "#7a4a22"; ctx.fillRect(ce.x - 4 * k, ce.y - h * .5, 8 * k, h * .5); ctx.fillStyle = "#3d7b2e"; ctx.beginPath(); ctx.arc(ce.x, ce.y - h * .7, h * .38, 0, 6.29); ctx.fill(); return { x: ce.x - h * .4, y: ce.y - h * 1.1, w: h * .8, h: h * 1.1 }; }
      ctx.fillStyle = o.t === "orto" ? "#7a5230" : "#6c8f3c"; romboSchermo(o.c + .1, o.r + .1, f[0] - .2, f[1] - .2); ctx.fill();
      return { x: ce.x - 40 * k, y: ce.y - 50 * k, w: 80 * k, h: 70 * k };
    }
    function bollina(o, ce, R) {   // sopra le piante: la goccia se hanno sete, i frutti se sono pronti
      var tipo = maturo(o) ? "pronto" : sete(o) ? "sete" : null; if (!tipo) return;
      var y = (R ? R.y : ce.y - TW) - TW * .12 + Math.sin(tAnim * 3 + o.k) * TW * .04, x = ce.x, rr = TW * .2;
      ctx.fillStyle = tipo === "pronto" ? "#fff8e1" : "#e7f5ff"; ctx.strokeStyle = tipo === "pronto" ? "#f59f00" : "#1c7ed6"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - rr * .3, y + rr * .9); ctx.lineTo(x, y + rr * 1.35); ctx.lineTo(x + rr * .3, y + rr * .9); ctx.fillStyle = tipo === "pronto" ? "#fff8e1" : "#e7f5ff"; ctx.fill();
      ctx.font = Math.round(rr * 1.15) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(tipo === "pronto" ? FRUTTI[ALBERI[o.t] ? ALBERI[o.t].frutto : o.pianta][2] : "💧", x, y + 1); ctx.textBaseline = "alphabetic";
    }
    function striscia(r0, r1, col) {   // una fascia lungo il davanti del terreno (marciapiede, strada), lunga fino a fuori dallo schermo
      var a = proj(-60, r0), b = proj(D.w + 60, r0), c2 = proj(D.w + 60, r1), d = proj(-60, r1);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
    }
    function strada() {
      var H = D.h;
      striscia(H + .08, H + .85, "#ddd7c8"); striscia(H + .85, H + .97, "#b3ab98");   // marciapiede e cordolo
      striscia(H + .97, H + 2.97, "#6d727a");                                          // l'asfalto
      striscia(H + 2.97, H + 3.09, "#b3ab98"); striscia(H + 3.09, H + 3.85, "#ddd7c8");
      for (var c = -60; c < D.w + 60; c += 1) { var a = proj(c, H + .08), b = proj(c, H + .85); ctx.strokeStyle = "rgba(120,110,95,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }   // le lastre del marciapiede
      var p0 = proj(-60, H + 1.97), p1 = proj(D.w + 60, H + 1.97);
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = Math.max(1.5, TW * .035); ctx.setLineDash([TW * .4, TW * .35]);   // la riga tratteggiata in mezzo
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); ctx.setLineDash([]);
    }
    var VICINI = null;
    function vicini() {   // alberi e cespugli dei giardini accanto, dietro al recinto (sempre gli stessi: seme fisso)
      if (!VICINI || VICINI.w !== D.w) {
        var r = rnd(911), l = [], i, specie = ["albero_melo_2", "cespuglio", "albero_ciliegio_2", "albero_limone_2", "cespuglio", "albero_arancio_2"];
        for (i = -1; i < D.h - .5; i += 1.3 + r() * .9) l.push({ c: -1.4 - r() * .8, r: i, n: specie[Math.floor(r() * specie.length)] });
        for (i = .2; i < D.w - .5; i += 1.3 + r() * .9) l.push({ c: i, r: -1.4 - r() * .8, n: specie[Math.floor(r() * specie.length)] });
        l.sort(function (a, b) { return a.c + a.r - b.c - b.r; }); VICINI = { w: D.w, l: l };
      }
      var k = TW / 100;
      VICINI.l.forEach(function (v) { var a = arte(v.n), ce = proj(v.c, v.r); if (a && a.im.complete && a.im.naturalWidth) ctx.drawImage(a.im, ce.x - a.info.ax * k, ce.y - a.info.ay * k, a.info.w * k, a.info.h * k); });
    }
    function recinto(dietro) {   // la staccionata tutto intorno al terreno: i due lati in fondo (dietro) e i due lati davanti
      var A = arte("staccionata_a"), B = arte("staccionata_b"), k = TW / 100, i, l = [];
      // a = bordo in alto a sinistra di una mattonella, b = bordo in alto a destra. Dietro: le mattonelle c=0 (a) e r=0 (b); davanti: quelle appena fuori, c=w (a) e r=h (b)
      if (dietro) { for (i = 0; i < D.h; i++) l.push([A, 0, i, 1]); for (i = 0; i < D.w; i++) l.push([B, i, 0, 0]); }
      else { for (i = 0; i < D.h; i++) l.push([A, D.w, i, 1]); for (i = 0; i < D.w; i++) if (!(i >= 5 && i <= 6)) l.push([B, i, D.h, 0]); }   // davanti al vialetto il cancello è aperto
      l.sort(function (p, q) { return p[1] + p[2] - q[1] - q[2]; });   // dal più lontano
      l.forEach(function (p) {
        var a = p[0], ce = proj(p[1] + .5, p[2] + .5);
        if (a && a.im.complete && a.im.naturalWidth) return ctx.drawImage(a.im, ce.x - a.info.ax * k, ce.y - a.info.ay * k, a.info.w * k, a.info.h * k);
        var s0 = p[3] ? proj(p[1], p[2] + 1) : proj(p[1], p[2]), s1 = p[3] ? proj(p[1], p[2]) : proj(p[1] + 1, p[2]);   // senza disegno: due assi chiare
        ctx.strokeStyle = "#f4ead2"; ctx.lineWidth = Math.max(2, TW * .04);
        [.12, .26].forEach(function (h) { ctx.beginPath(); ctx.moveTo(s0.x, s0.y - TW * h); ctx.lineTo(s1.x, s1.y - TW * h); ctx.stroke(); });
      });
    }
    function disegnaAvatar() {
      if (!IM) return;
      var p = proj(av.u, av.v), h = TW * 1.42, w = h / 1.3, cammina = av.strada.length > 0, set = av.dietro ? IM.dietro : IM.davanti;
      var im = cammina && Math.floor(av.t * 6) % 2 ? set[1] : set[0];
      if (!im.complete || !im.naturalWidth) return;
      var alza = cammina ? Math.abs(Math.sin(av.t * 18)) * h * .02 : 0, piega = 0, al = 1;
      if (av.fa === "entra") { al = Math.max(0, 1 - av.ft / .6); } else if (av.fa === "esce") al = Math.min(1, av.ft / .45);
      if (av.fa === "raccogli") piega = Math.sin(Math.min(1, av.ft / .5) * Math.PI) * .05;
      if (av.fa === "dondola") alza += Math.abs(Math.sin(av.ft * 5)) * h * .08;
      ctx.globalAlpha = al;
      ctx.fillStyle = "rgba(30,40,10,.28)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, w * .3, w * .1, 0, 0, 6.29); ctx.fill();
      ctx.save(); ctx.translate(p.x, p.y - alza + piega * h); if (av.specchio) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h * .96, w, h); ctx.restore();
      if (av.fa === "acqua" && av.su) {   // l'annaffiatoio verde e le gocce
        var dir = av.specchio ? -1 : 1, mx = p.x + dir * w * .3, my = p.y - h * .42;
        ctx.save(); ctx.translate(mx, my); ctx.rotate(dir * (.5 + Math.sin(av.ft * 8) * .08)); ctx.scale(dir, 1);
        ctx.fillStyle = "#2f9e44"; ctx.strokeStyle = "#1b5e2a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w * .12, -w * .1, w * .24, w * .18, 4) : ctx.rect(-w * .12, -w * .1, w * .24, w * .18); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w * .1, -w * .02); ctx.lineTo(w * .3, -w * .12); ctx.lineWidth = 3; ctx.strokeStyle = "#2f9e44"; ctx.stroke(); ctx.restore();
        ctx.fillStyle = "#74c0fc"; for (var g2 = 0; g2 < 6; g2++) { var t2 = (av.ft * 3 + g2 / 6) % 1; ctx.beginPath(); ctx.arc(mx + dir * (w * .32 + t2 * w * .2), my - w * .05 + t2 * h * .35, 2 + TW * .015, 0, 6.29); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    }

    // ---- il tempo che passa: l'avatar cammina, i frutti volano; quando è tutto fermo non si ridisegna ----
    function aggiorna(dt) {
      tAnim += dt; var mosso = false;
      if (av.strada.length) {
        var t = av.strada[0], du = t.u - av.u, dv = t.v - av.v, d = Math.hypot(du, dv), passo = 3 * dt;
        av.t += dt; av.dietro = du + dv < -1e-3 ? true : du + dv > 1e-3 ? false : av.dietro; av.specchio = du - dv < -1e-3 ? true : du - dv > 1e-3 ? false : av.specchio;
        if (d <= passo) { av.u = t.u; av.v = t.v; av.strada.shift(); if (!av.strada.length && av.poi) { var f = av.poi; av.poi = null; f(); } }
        else { av.u += du / d * passo; av.v += dv / d * passo; }
        mosso = true;
      }
      if (av.fa) { av.ft += dt; mosso = true; if (av.ft > (av.fa === "acqua" ? 1.1 : av.fa === "dondola" ? 2.4 : .8) && av.fa !== "entra") { av.fa = null; av.su = null; } }
      volano.forEach(function (p) { p.t += dt; p.x += p.vx; p.y += p.vy; p.vy += .25; }); volano = volano.filter(function (p) { return p.t < 1.1; });
      if (volano.length) mosso = true;
      // le bollicine sopra le piante ondeggiano piano: basta ridisegnare ogni tanto
      if (mosso) sporco = true;
    }
    var anim = 0, ult = 0, tBolle = 0;
    function giro(o) {
      if (!vivo()) return chiudi();
      var dt = Math.min(.05, (o - ult) / 1000 || 0); ult = o;
      aggiorna(dt); tBolle += dt;
      if (tBolle > .08) { tBolle = 0; if (D.ogg.some(function (x) { return maturo(x) || sete(x); })) sporco = true; }
      if (sporco) { sporco = false; disegna(); }
      anim = requestAnimationFrame(giro);
    }
    var tCresci = setInterval(function () { if (!vivo()) return; cresciTutto(); sporco = true; }, 30000);
    var tFase = setInterval(function () { var f = fase(); if (f !== FASE) { FASE = f; cacheArte = {}; sfondo = null; sporco = true; } }, 60000);

    function chiudi() { cancelAnimationFrame(anim); clearInterval(tCresci); clearInterval(tFase); window.removeEventListener("resize", misura); }
    function esci() { chiudi(); clearTimeout(tSalva); if (opts.salva) opts.salva(D); if (opts.indietro) opts.indietro(); }
    s._monta = function () {
      quandoPronta = function () { if (vivo()) { sfondo = null; sporco = true; } };   // un disegno è arrivato: si rifà il prato (coi vialetti) e si ridisegna
      cresciTutto(); misura(); aggTesta();
      // l'arte arriva un po' dopo (immagini): quando è pronta si ridisegna
      setTimeout(function () { sfondo = null; sporco = true; }, 300); setTimeout(function () { sfondo = null; sporco = true; }, 1200);
      var pronti = D.ogg.filter(maturo).length, assetati = D.ogg.filter(sete).length;
      if (pronti) dimmi("Ci sono " + pronti + (pronti === 1 ? " pianta pronta" : " piante pronte") + " da raccogliere! 🧺");
      else if (assetati) dimmi("💧 " + assetati + (assetati === 1 ? " pianta ha" : " piante hanno") + " sete");
      anim = requestAnimationFrame(function (o) { ult = o; giro(o); });
    };
    s._chiudi = chiudi;
    window.__giardino = { D: D, av: av, disegna: function () { disegna(); }, fase: function (f) { FASE = f; cacheArte = {}; sfondo = null; sporco = true; }, proj: function (c, r) { return proj(c, r); }, tap: function (x, y) { tocca(x, y); }, vai: function (c, r) { vaiA([{ c: c, r: r }]); }, tocca: function (o) { vaiAOggetto(o); }, avanza: function (sec) { for (var i = 0; i < sec * 60; i++) aggiorna(1 / 60); sporco = true; }, cresciTutto: cresciTutto, foto: function () { disegna(); return cv.toDataURL("image/png"); } };   // (per le prove)
    return s;
  }

  // ---------- lo stile (una volta sola, prefisso gd-) ----------
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.gd-vista{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;position:relative;background:#7fb35a;user-select:none;-webkit-user-select:none}",
      ".gd-tela{position:absolute;inset:0;width:100%;height:100%;touch-action:none}",
      ".gd-testa{position:absolute;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:3;display:flex;align-items:center;gap:6px}",
      ".gd-tasto{flex:none;width:38px;height:38px;border:0;border-radius:12px;cursor:pointer;font:inherit;font-size:1.3rem;font-weight:900;color:#fff;background:rgba(30,60,20,.5)}",
      ".gd-nome{flex:1;min-width:0;font-weight:900;font-size:1.02rem;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".gd-chip{flex:none;height:34px;padding:0 10px;border-radius:12px;display:flex;align-items:center;font-weight:900;font-size:.92rem;color:#fff;background:rgba(30,60,20,.55)}",
      ".gd-giu{position:absolute;left:8px;right:8px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:3;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}",
      ".gd-bott{height:46px;border:0;border-radius:14px;cursor:pointer;font:inherit;font-weight:900;font-size:.82rem;color:#fff;background:rgba(30,60,20,.62);box-shadow:inset 0 0 0 1.5px rgba(220,255,200,.3)}",
      ".gd-sistema .gd-bott:not(:nth-child(3)){opacity:.45}",
      ".gd-sis{position:absolute;left:10px;right:10px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:3;display:none;align-items:center;gap:6px;padding:6px 6px 6px 12px;border-radius:14px;background:rgba(255,250,235,.95);box-shadow:0 4px 12px rgba(0,0,0,.25)}",
      ".gd-sis.su{display:flex}",
      ".gd-sis-t{flex:1;min-width:0;font-weight:800;font-size:.82rem;color:#2b4a1f}",
      ".gd-sis-b{flex:none;height:36px;padding:0 10px;border:0;border-radius:10px;cursor:pointer;font:inherit;font-weight:900;font-size:.85rem;color:#fff;background:#3f7a2e}",
      ".gd-avviso{position:absolute;left:50%;top:calc(54px + env(safe-area-inset-top));z-index:5;transform:translateX(-50%);max-width:92%;padding:8px 14px;border-radius:999px;text-align:center;font-weight:900;font-size:.88rem;color:#2b2200;background:#ffe066;box-shadow:0 6px 16px rgba(0,0,0,.3);opacity:0;pointer-events:none}",
      ".gd-avviso.su{animation:gdAvv 2.6s ease forwards}@keyframes gdAvv{0%{opacity:0;transform:translate(-50%,8px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}82%{opacity:1}100%{opacity:0}}",
      ".gd-sopra{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(15,30,10,.5);opacity:0;pointer-events:none;transition:opacity .25s}",
      ".gd-sopra.su{opacity:1;pointer-events:auto}",
      ".gd-carta{width:100%;max-width:340px;max-height:calc(var(--alt,100dvh) - 40px);overflow:auto;padding:16px 14px;border-radius:20px;text-align:center;color:#2b3a1f;background:#fbfaf2;box-shadow:0 10px 0 #3f6a2a,0 18px 40px rgba(0,0,0,.4),inset 0 0 0 3px #a9c98a;animation:gdSu .35s cubic-bezier(.3,1.4,.5,1)}",
      ".gd-larga{max-width:420px}",
      "@keyframes gdSu{from{transform:translateY(20px) scale(.92);opacity:.3}}",
      ".gd-carta h2{margin:4px 0 8px;font-size:1.25rem;font-weight:900}",
      ".gd-fig{display:block;margin:0 auto;object-fit:contain}",
      ".gd-frase{margin:8px 0 0;font-size:.92rem;line-height:1.4;font-weight:700}",
      ".gd-nota{margin:8px 0 0;font-size:.8rem;font-weight:700;color:#5f7a45}",
      ".gd-tasti{display:flex;flex-direction:column;gap:8px;margin-top:14px}",
      ".gd-carta .btn-fantasma{color:#2b4a1f;background:#eef5e4;box-shadow:inset 0 0 0 2px #a9c98a}",
      ".gd-schede{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px;-webkit-overflow-scrolling:touch}",
      ".gd-scheda{flex:none;height:32px;padding:0 12px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-weight:900;font-size:.8rem;color:#2b4a1f;background:#eef5e4}",
      ".gd-scheda.on{color:#fff;background:#3f7a2e}",
      ".gd-griglia{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}",
      ".gd-voce{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px 8px;border:0;border-radius:14px;cursor:pointer;font:inherit;color:#2b3a1f;background:#eef5e4}",
      ".gd-voce:disabled,.gd-voce.caro{opacity:.5}",
      ".gd-voce b{font-size:.74rem;line-height:1.15}.gd-voce small{font-size:.66rem;font-weight:800;color:#5f7a45;line-height:1.2}",
      ".gd-righe{display:flex;flex-direction:column;gap:6px;text-align:left}",
      ".gd-riga{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:12px;background:#eef5e4;font-weight:800}",
      ".gd-riga span:nth-child(2){flex:1}.gd-emo{font-size:1.4rem}",
      ".gd-vendi{flex:none;height:34px;padding:0 10px;border:0;border-radius:10px;cursor:pointer;font:inherit;font-weight:900;color:#fff;background:#3f7a2e}"
    ].join("");
    document.head.appendChild(st);
  }

  window.SGGiardino = { crea: crea, ALBERI: ALBERI, SEMI: SEMI };
})();
