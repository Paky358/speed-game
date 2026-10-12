/* =========================================================
   SPeeD GAME — CASA E GIARDINO (il tuo terreno visto dall'alto e inclinato, come in The Sims)
   - La casa si COSTRUISCE: muri tracciati col dito sui bordi delle mattonelle, porte, finestre,
     pavimenti, pitture e carte da parati; il tetto lo calcola il gioco (a padiglione, da qualsiasi forma).
   - Entrando il tetto sparisce e i muri davanti si abbassano. La vista gira a scatti di 90° (↻).
   - Fuori il giardino: alberi da frutto (crescono solo annaffiati, mai muoiono), orto coi semi,
     fiori, decorazioni, vialetti; i frutti vanno nel cesto e si vendono.
   - Modalità: Vivi (l'avatar va dove tocchi), Compra, Costruisci, Sistema (sposti, giri, baule, rivendi).
   Disegni: js/giardino-arte.js (SGGiardinoArte), js/costruzioni-arte.js (SGKit: muri, pavimenti,
   porte, finestre, tetti), js/mobili-arte.js (SGMobiliArte). Misure comuni ("unità del disegno" = 1/100
   della mattonella): mattonella = rombo 100×50 ≈ 1 metro, muro alto 200, avatar 130.
   Muri: "a,c,r" = bordo tra le mattonelle (c-1,r) e (c,r); "b,c,r" = bordo tra (c,r-1) e (c,r).
   SGGiardino.crea({ omino, nome, dati, daCasa, salva(dati), monete(), spendi(n), guadagna(n), audio, indietro() })
   ========================================================= */
(function () {
  "use strict";

  var ORA = 3600e3, ACQUA = 24 * ORA;   // un'annaffiata fa crescere per 24 ore
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
  // il negozio del giardino (i mobili arrivano da js/mobili-arte.js, divisi per stanza)
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
  var PREZZO = {}, NOME = {}, DEL_GIARDINO = {};
  NEGOZIO.forEach(function (g) { g.voci.forEach(function (v) { PREZZO[v.t] = v.prezzo; NOME[v.t] = v.nome; DEL_GIARDINO[v.t] = 1; }); });
  var STANZE = { bagno: "🛁 Bagno", soggiorno: "🛋️ Soggiorno", cucina: "🍳 Cucina", camera: "🛏️ Camera" };
  var FP = { fontana: [2, 2], altalena: [2, 1] };
  var TERRA = { vialetto: 1, ghiaia: 1 };
  var ALLARGA = [{ a: 18, prezzo: 3000 }, { a: 22, prezzo: 7000 }, { a: 26, prezzo: 12000 }];   // il terreno si allarga verso di te
  var ALTO = 200, BASSO = 42, SPESS = .09, PEND = 52, TETTO_MAX = 3;   // muro alto e abbassato (unità del disegno), spessore (mattonelle), pendenza del tetto
  var COSTO = { muro: 40, porta: 400, finestra: 300, pittura: 15, carta: 30, pavimento: 20, tetto: 1500, mobile: 350 };
  var CANCELLO = [5, 6];   // sul bordo davanti del terreno, dove arriva il vialetto

  // ---------- attrezzi ----------
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }   // solo quando si tocca per scegliere
  function fase() { try { return window.SGCitta ? SGCitta.fase(new Date()) : "giorno"; } catch (e) { return "giorno"; } }
  function durata(ms) { var m = Math.ceil(ms / 60000); if (m < 60) return m + " min"; var h = Math.floor(m / 60), r = m % 60; return h + (h === 1 ? " ora" : " ore") + (r ? " e " + r + " min" : ""); }
  function infoMobile(t) { var M = window.SGMobiliArte; try { return M && M.info ? M.info(t) : null; } catch (e) { return null; } }
  function fpDi(t) { var m = infoMobile(t); return FP[t] || (m && m.fp) || [1, 1]; }
  function tipoDi(t) { if (TERRA[t]) return "terra"; var m = infoMobile(t); return (m && m.tipo) || "piedi"; }
  function nomeDi(t) { var m = infoMobile(t); return NOME[t] || (m && m.nome) || t; }
  function prezzoDi(t) { var m = infoMobile(t); return PREZZO[t] || (m && m.prezzo) || COSTO.mobile; }

  function datiIniziali() {   // si parte con una casetta (soggiorno con la cucina, camera, bagno), un germoglio e un'aiuola
    var D = { v: 2, w: 14, h: 14, ogg: [], muri: {}, pav: {}, tetto: null, baule: {}, cesto: {}, ultimo: 0, vista: 0 }, c, r;
    function metti(t, c, r, x) { var o = { k: ++D.ultimo, t: t, c: c, r: r, d: 0 }; for (var q in x || {}) o[q] = x[q]; D.ogg.push(o); }
    function muro(t, c, r) { D.muri[t + "," + c + "," + r] = { s: [null, null], ap: null }; }
    for (r = 2; r < 8; r++) { muro("a", 3, r); muro("a", 7, r); muro("a", 10, r); }
    for (c = 3; c < 10; c++) { muro("b", c, 2); muro("b", c, 8); }
    for (c = 7; c < 10; c++) muro("b", c, 5);
    ["b,5,8", "a,7,3", "a,7,6"].forEach(function (k) { D.muri[k].ap = { t: "porta", id: null }; });   // id null = la prima del catalogo
    ["b,4,2", "b,8,2", "a,3,4", "a,10,3", "a,10,6", "b,3,8", "b,8,8"].forEach(function (k) { D.muri[k].ap = { t: "finestra", id: null }; });
    for (r = 8; r < 14; r++) { metti("vialetto", 5, r); metti("vialetto", 6, r); }
    metti("melo", 1, 10, { cresci: 0, fr: 0, acqua: 0, agg: Date.now() });
    metti("orto", 11, 10);
    metti("cassetta_posta", 7, 13);
    return D;
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
  function suonoMuro() { suona([180, 140], "square", .06, .05); }
  function suonoAcqua() {
    var c = AUDIO && AUDIO(); if (!c) return;
    try { var n = Math.floor(c.sampleRate * .6), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) * .5;
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = "bandpass"; f.frequency.value = 2400; g.gain.value = .25; s.connect(f); f.connect(g); g.connect(c.destination); s.start(); } catch (e) {}
  }

  // ---------- i disegni: dall'arte (SVG) a immagini pronte per il canvas, una volta sola ----------
  var cacheArte = {}, quandoPronta = null;   // quandoPronta: la schermata aperta si ridisegna quando arriva un disegno
  function immagineSvg(k, fn) {
    if (cacheArte[k] !== undefined) return cacheArte[k];
    var s = null; try { s = fn(); } catch (e) {}
    if (!s) return (cacheArte[k] = null);
    var im = new Image(); im.onload = function () { if (quandoPronta) quandoPronta(); }; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    return (cacheArte[k] = im);
  }
  function arteOgg(nome, dietro, notte, col) {   // un oggetto in piedi (mobili o giardino) → { im, info }
    var M = window.SGMobiliArte, A = window.SGGiardinoArte, inf = null, fonte = null;
    try { inf = M && M.info ? M.info(nome) : null; fonte = M; if (!inf) { inf = A && A.info ? A.info(nome) : null; fonte = A; } } catch (e) {}
    if (!inf) return null;
    var dt = !!(dietro && inf.dietro);
    var im = immagineSvg("o|" + nome + (dt ? "|d" : "") + (notte ? "|n" : "") + (col ? "|" + col : ""), function () { return fonte.svg(nome, { dietro: dt, notte: !!notte, col: col || null }); });
    return im ? { im: im, info: inf } : null;
  }
  function listaKit(gruppo) { var K = window.SGKit; return (K && K[gruppo]) || []; }
  function voceKit(gruppo, id) { var l = listaKit(gruppo); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function primoKit(gruppo, dove) { var l = listaKit(gruppo); for (var i = 0; i < l.length; i++) if (!dove || !l[i].dove || l[i].dove === dove || l[i].dove === "tutti") return l[i]; return l[0] || null; }
  function texKit(gruppo, id, notte) { var v = voceKit(gruppo, id); if (!v) return null; return immagineSvg("k|" + gruppo + "|" + id + (notte ? "|n" : ""), function () { return v.svg({ notte: !!notte }); }); }
  function pronta(im) { return !!(im && im.complete && im.naturalWidth); }

  // =========================================================
  //  LA SCHERMATA
  // =========================================================
  function crea(opts) {
    stile();
    AUDIO = opts.audio || null;
    var D = opts.dati && opts.dati.v >= 2 ? opts.dati : datiIniziali();
    D.ogg = D.ogg || []; D.muri = D.muri || {}; D.pav = D.pav || {}; D.baule = D.baule || {}; D.cesto = D.cesto || {}; D.ultimo = D.ultimo || D.ogg.length;
    var VR = D.vista || 0;   // la vista: girata di 90° ogni volta (0…3)
    var tSalva = null;
    function salva() { clearTimeout(tSalva); tSalva = setTimeout(function () { if (opts.salva) opts.salva(D); }, 400); }
    function monete() { return opts.monete ? opts.monete() : 0; }
    function paga(n) { if (n > 0 && opts.spendi) opts.spendi(n); else if (n < 0 && opts.guadagna) opts.guadagna(-n); aggTesta(); }

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
    function maturo(o) { return ALBERI[o.t] ? stadio(o) === 3 : !!(o.t === "orto" && o.pianta && stadio(o) === 2); }
    function sete(o) { if (!ALBERI[o.t] && !(o.t === "orto" && o.pianta && !maturo(o))) return false; if (ALBERI[o.t] && maturo(o)) return false; return !o.acqua || Date.now() > o.acqua + ACQUA; }
    function nomeArte(o) {
      if (ALBERI[o.t]) return "albero_" + o.t + "_" + stadio(o);
      if (o.t === "orto") return o.pianta ? "orto_" + o.pianta + "_" + stadio(o) : "orto";
      return o.t;
    }
    function manca(o) {
      var A = ALBERI[o.t];
      if (A) return o.cresci < A.tot ? A.tot - o.cresci : A.periodo - o.fr;
      if (o.t === "orto" && o.pianta) return SEMI[o.pianta].tot - (o.cresci || 0);
      return 0;
    }

    // ---- il terreno: oggetti, muri, stanze ----
    function fuoriLotto(c, r) { return c < 0 || r < 0 || c >= D.w || r >= D.h; }
    function fpMondo(o) { var f = fpDi(o.t); return (o.d || 0) % 2 ? [f[1], f[0]] : f; }
    function box(o) { var f = fpMondo(o); return { c0: o.c, c1: o.c + f[0], r0: o.r, r1: o.r + f[1] }; }
    function appeso(o) { return !!o.muro; }
    function occupato(c, r, salta) {   // c'è qualcosa che non si calpesta?
      if (fuoriLotto(c, r)) return true;
      for (var i = 0; i < D.ogg.length; i++) { var o = D.ogg[i]; if (o === salta || appeso(o) || tipoDi(o.t) !== "piedi") continue; var b = box(o); if (c >= b.c0 && c < b.c1 && r >= b.r0 && r < b.r1) return true; }
      return false;
    }
    function aTerraIn(c, r, salta) { for (var i = 0; i < D.ogg.length; i++) { var o = D.ogg[i]; if (o === salta || appeso(o) || tipoDi(o.t) !== "terra") continue; var b = box(o); if (c >= b.c0 && c < b.c1 && r >= b.r0 && r < b.r1) return o; } return null; }
    function chiave(t, c, r) { return t + "," + c + "," + r; }
    function muro(t, c, r) { return D.muri[chiave(t, c, r)]; }
    function muroTra(c1, r1, c2, r2) { return c2 !== c1 ? muro("a", Math.max(c1, c2), r1) : muro("b", c1, Math.max(r1, r2)); }
    function porta(m) { return !!(m && m.ap && m.ap.t === "porta"); }
    function passa(c1, r1, c2, r2) { var m = muroTra(c1, r1, c2, r2); return !m || porta(m); }
    function lati(k) { var p = k.split(","), t = p[0], c = +p[1], r = +p[2]; return t === "a" ? [[c - 1, r], [c, r]] : [[c, r - 1], [c, r]]; }   // le due mattonelle ai lati del muro (lato 0, lato 1)
    var STANZA = null, ANGOLI = null, CASE = [];
    function stanza(c, r) { return fuoriLotto(c, r) || !STANZA ? 0 : STANZA[r * D.w + c]; }
    function dentro(c, r) { return stanza(c, r) > 0; }
    function calcolaStanze() {   // fuori = quello che si raggiunge dal bordo senza attraversare muri (le porte contano come muri); il resto sono stanze
      var W = D.w, H = D.h, st = [], coda = [], i, c, r;
      for (i = 0; i < W * H; i++) st.push(-1);
      function riempi(id) { while (coda.length) { var q = coda.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var c2 = q[0] + d[0], r2 = q[1] + d[1]; if (fuoriLotto(c2, r2) || st[r2 * W + c2] !== -1 || muroTra(q[0], q[1], c2, r2)) return; st[r2 * W + c2] = id; coda.push([c2, r2]); }); } }
      for (c = 0; c < W; c++) for (r = 0; r < H; r++) if ((c === 0 || r === 0 || c === W - 1 || r === H - 1) && st[r * W + c] === -1) { st[r * W + c] = 0; coda.push([c, r]); }
      riempi(0);
      var id = 0;
      for (i = 0; i < W * H; i++) if (st[i] === -1) { st[i] = ++id; coda.push([i % W, Math.floor(i / W)]); riempi(id); }
      STANZA = st;
      // il tetto: per ogni angolo, quanto è lontano dal bordo della casa (così viene a padiglione da qualsiasi forma)
      var A = [], q2 = [];
      for (r = 0; r <= H; r++) for (c = 0; c <= W; c++) { var tutto = dentro(c - 1, r - 1) && dentro(c, r - 1) && dentro(c - 1, r) && dentro(c, r); A.push(tutto ? 1e9 : 0); if (!tutto) q2.push([c, r]); }
      for (var h = 0; h < q2.length; h++) { var p = q2[h], v = A[p[1] * (W + 1) + p[0]];
        for (var dc = -1; dc <= 1; dc++) for (var dr = -1; dr <= 1; dr++) { var c3 = p[0] + dc, r3 = p[1] + dr; if (c3 < 0 || r3 < 0 || c3 > W || r3 > H) continue; var j = r3 * (W + 1) + c3; if (A[j] > v + 1) { A[j] = v + 1; q2.push([c3, r3]); } } }
      ANGOLI = A;
      // le case (gruppi di stanze attaccate): una per tetto
      var vista = {}; CASE = [];
      for (i = 0; i < W * H; i++) if (st[i] > 0 && !vista[i]) {
        var gr = [], cd = [i]; vista[i] = 1;
        while (cd.length) { var x = cd.pop(), cx = x % W, rx = Math.floor(x / W); gr.push([cx, rx]); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var c4 = cx + d[0], r4 = rx + d[1], j2 = r4 * W + c4; if (!fuoriLotto(c4, r4) && st[j2] > 0 && !vista[j2]) { vista[j2] = 1; cd.push(j2); } }); }
        var bx = { c0: 1e9, c1: -1e9, r0: 1e9, r1: -1e9 }; gr.forEach(function (t) { bx.c0 = Math.min(bx.c0, t[0]); bx.c1 = Math.max(bx.c1, t[0] + 1); bx.r0 = Math.min(bx.r0, t[1]); bx.r1 = Math.max(bx.r1, t[1] + 1); });
        CASE.push({ t: gr, b: bx });
      }
    }
    function muroPossibile(t, c, r) {   // non sul bordo del terreno, e non attraverso un mobile o una pianta
      if (t === "a" ? (c < 1 || c > D.w - 1 || r < 0 || r >= D.h) : (r < 1 || r > D.h - 1 || c < 0 || c >= D.w)) return false;
      for (var i = 0; i < D.ogg.length; i++) { var o = D.ogg[i]; if (appeso(o)) continue; var b = box(o);
        if (t === "a" ? (b.c0 < c && c < b.c1 && r >= b.r0 && r < b.r1) : (b.r0 < r && r < b.r1 && c >= b.c0 && c < b.c1)) return false; }
      return true;
    }
    function libero(t, c, r, d, salta) {   // si può mettere lì (oggetto in piedi o a terra)?
      var f = fpDi(t); if ((d || 0) % 2) f = [f[1], f[0]];
      var tipo = tipoDi(t), daFuori = DEL_GIARDINO[t];
      for (var a = 0; a < f[0]; a++) for (var b = 0; b < f[1]; b++) {
        var cc = c + a, rr = r + b;
        if (fuoriLotto(cc, rr)) return false;
        if (daFuori && dentro(cc, rr)) return false;   // alberi, fiori e vialetti solo in giardino
        if (tipo === "terra" ? aTerraIn(cc, rr, salta) : occupato(cc, rr, salta)) return false;
        if (a && muroTra(cc - 1, rr, cc, rr)) return false;   // niente muri in mezzo a un mobile
        if (b && muroTra(cc, rr - 1, cc, rr)) return false;
      }
      if (tipo === "piedi" && Math.floor(av.u) >= c && Math.floor(av.u) < c + f[0] && Math.floor(av.v) >= r && Math.floor(av.v) < r + f[1]) return false;   // non sopra l'avatar
      return true;
    }
    function oggettoIn(c, r) { for (var i = D.ogg.length - 1; i >= 0; i--) { var o = D.ogg[i]; if (appeso(o) || tipoDi(o.t) !== "piedi") continue; var b = box(o); if (c >= b.c0 && c < b.c1 && r >= b.r0 && r < b.r1) return o; } return null; }
    function defMuro(dentroLato) { var v = primoKit("muri", dentroLato ? "dentro" : "fuori"); return v ? v.id : null; }
    function defPav() { var v = primoKit("pavimenti", "dentro"); return v ? v.id : null; }

    // ---- la struttura ----
    var s = el("div", "schermata gd-vista"), cv = el("canvas", "gd-tela"), ctx = cv.getContext("2d");
    var testa = el("div", "gd-testa"), bInd = el("button", "gd-tasto", "‹"), titolo = el("div", "gd-nome", "🏡 Casa e giardino"), bGira = el("button", "gd-tasto", "↻"), cMonete = el("div", "gd-chip");
    bInd.setAttribute("aria-label", "Torna in città"); bInd.onclick = function () { esci(); };
    bGira.setAttribute("aria-label", "Gira la vista"); bGira.onclick = function () { vibra(10); gira(); };
    [bInd, titolo, bGira, cMonete].forEach(function (n) { testa.appendChild(n); });
    var giu = el("div", "gd-giu"), bCompra = el("button", "gd-bott", "🛒 Compra"), bCostr = el("button", "gd-bott", "🔨 Costruisci"), bSistema = el("button", "gd-bott", "✏️ Sistema"), bCesto = el("button", "gd-bott");
    bCompra.onclick = function () { vibra(10); negozio(); };
    bCostr.onclick = function () { vibra(10); cambiaModo(modo === "costruisci" ? "vivi" : "costruisci"); };
    bSistema.onclick = function () { vibra(10); cambiaModo(modo === "sistema" ? "vivi" : "sistema"); };
    bCesto.onclick = function () { vibra(10); cesto(); };
    [bCompra, bCostr, bSistema, bCesto].forEach(function (b) { giu.appendChild(b); });
    var barra = el("div", "gd-sis"), attrezzi = el("div", "gd-attrezzi"), avviso = el("div", "gd-avviso"), sopra = el("div", "gd-sopra");
    [cv, testa, giu, attrezzi, barra, avviso, sopra].forEach(function (n) { s.appendChild(n); });
    function aggTesta() {
      cMonete.textContent = "🪙 " + cifre(monete());
      var n = 0; for (var k in D.cesto) n += D.cesto[k]; bCesto.textContent = "🧺 Cesto" + (n ? " (" + n + ")" : "");
    }
    function dimmi(t) { avviso.textContent = t; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    function vivo() { return document.body.contains(cv); }

    // ---- la vista: il terreno girato (0…3), spostato col dito, ingrandito con due dita ----
    var cw = 360, ch = 640, dpr = 1, zoom = 1, TW = 64, ox = 0, oy = 0, sfondo = null, sporco = true;
    function VW() { return VR % 2 ? D.h : D.w; }
    function VH() { return VR % 2 ? D.w : D.h; }
    function rv(x, y) { var W = D.w, H = D.h; return VR === 1 ? [H - y, x] : VR === 2 ? [W - x, H - y] : VR === 3 ? [y, W - x] : [x, y]; }   // dal mondo alla vista
    function vr(a, b) { var W = D.w, H = D.h; return VR === 1 ? [b, H - a] : VR === 2 ? [W - a, H - b] : VR === 3 ? [W - b, a] : [a, b]; }   // dalla vista al mondo
    function pv(a, b) { return { x: ox + (a - b) * TW / 2, y: oy + (a + b) * TW / 4 }; }   // dalla vista allo schermo
    function pw(x, y) { var v = rv(x, y); return pv(v[0], v[1]); }                           // dal mondo allo schermo
    function schermoV(x, y) { var a = (x - ox) / (TW / 2), b = (y - oy) / (TW / 4); return [(a + b) / 2, (b - a) / 2]; }
    function schermoW(x, y) { var v = schermoV(x, y); return vr(v[0], v[1]); }               // dallo schermo al mondo (a terra)
    function boxV(b) { var p = rv(b.c0, b.r0), q = rv(b.c1, b.r1); return { c0: Math.min(p[0], q[0]), c1: Math.max(p[0], q[0]), r0: Math.min(p[1], q[1]), r1: Math.max(p[1], q[1]) }; }
    function vecV(dx, dy) { return VR === 1 ? [-dy, dx] : VR === 2 ? [-dx, -dy] : VR === 3 ? [dy, -dx] : [dx, dy]; }   // una direzione del mondo vista da qui
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      var pw0 = cw, ph0 = ch;
      cw = s.clientWidth || 360; ch = s.clientHeight || 640; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      TW = Math.round(Math.min(cw / 6.2, 76) * zoom);
      if (!misura.fatta) { misura.fatta = true; centra(6.5, 7.5); } else { ox += (cw - pw0) / 2; oy += (ch - ph0) / 2; }
      sfondo = null; sporco = true;
    }
    window.addEventListener("resize", misura);
    function centra(x, y) { var p = pw(x, y); ox += cw / 2 - p.x; oy += ch * .5 - p.y; }
    function limita() {   // il terreno non scappa via dallo schermo
      var su = pv(0, 0), dx = pv(VW(), 0), sx = pv(0, VH()), gi = pv(VW(), VH());
      if (dx.x < cw * .35) ox += cw * .35 - dx.x; if (sx.x > cw * .65) ox -= sx.x - cw * .65;
      if (gi.y < ch * .45) oy += ch * .45 - gi.y; if (su.y > ch * .55) oy -= su.y - ch * .55;
    }
    function zooma(z, cx, cy) {
      var nz = Math.max(.6, Math.min(1.8, z)); if (nz === zoom) return;
      var g = schermoV(cx, cy); zoom = nz; TW = Math.round(Math.min(cw / 6.2, 76) * zoom);
      var p = pv(g[0], g[1]); ox += cx - p.x; oy += cy - p.y; limita(); sfondo = null; sporco = true;
    }
    var giroAnim = null;
    function gira() {   // la vista gira di 90°: il punto in mezzo allo schermo resta in mezzo
      var g = schermoW(cw / 2, ch / 2), foto = null;
      try { foto = document.createElement("canvas"); foto.width = cv.width; foto.height = cv.height; foto.getContext("2d").drawImage(cv, 0, 0); } catch (e) { foto = null; }
      VR = (VR + 1) % 4; D.vista = VR; salva();
      var p = pw(g[0], g[1]); ox += cw / 2 - p.x; oy += ch / 2 - p.y; limita();
      sfondo = null; sporco = true; giroAnim = foto ? { t: 0, foto: foto } : null;
      suona([520, 660], "sine", .06, .06);
    }

    // ---- l'avatar: davanti quando viene verso di te, di spalle quando va verso il fondo ----
    function immagine(cfg, o) { var im = new Image(); try { im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, o || {})); } catch (e) {} im.onload = function () { sporco = true; }; return im; }
    var mio = opts.omino && window.SGOmino ? opts.omino : (window.SGOmino ? SGOmino.casuale(opts.nome || "Io") : null);
    var IM = mio ? { davanti: [immagine(mio), immagine(mio, { cammina: true })], dietro: [immagine(mio, { spalle: true }), immagine(mio, { spalle: true, cammina: true })] } : null;
    var av = { u: 5.5, v: 8.6, fw: [0, 1], strada: [], t: 0, fa: null, ft: 0, poi: null };   // fw: dove guarda (direzione nel mondo)
    if (opts.daCasa) { av.fa = "esce"; av.strada = [{ u: 5.5, v: 9.3 }]; }          // esci dalla porta di casa
    else { av.u = 5.9; av.v = D.h + .6; av.strada = [{ u: 5.9, v: D.h - 1.4 }]; }   // dalla città: arrivi dal marciapiede ed entri dal cancello

    // la strada più corta tra le mattonelle (anche in diagonale, senza tagliare angoli né attraversare i muri: solo le porte)
    function strada(da, versoLista) {
      var W = D.w, H = D.h, key = function (c, r) { return r * W + c; }, prec = {}, coda = [da], vista = {}; vista[key(da.c, da.r)] = 1;
      var obiettivi = {}; versoLista.forEach(function (q) { obiettivi[key(q.c, q.r)] = q; });
      function ok(c1, r1, c2, r2) { return !fuoriLotto(c2, r2) && passa(c1, r1, c2, r2) && (!occupato(c2, r2) || obiettivi[key(c2, r2)]); }
      while (coda.length) {
        var q = coda.shift(), kq = key(q.c, q.r);
        if (obiettivi[kq]) { var p = [q]; while (prec[kq] != null) { kq = prec[kq]; p.unshift({ c: kq % W, r: Math.floor(kq / W) }); } return p; }
        [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) {
          var c = q.c + d[0], r = q.r + d[1], k2 = key(c, r);
          if (c < 0 || r < 0 || c >= W || r >= H || vista[k2]) return;
          if (!d[0] || !d[1]) { if (!ok(q.c, q.r, c, r)) return; }
          else if (!ok(q.c, q.r, c, q.r) || !ok(c, q.r, c, r) || !ok(q.c, q.r, q.c, r) || !ok(q.c, r, c, r) || occupato(c, q.r) || occupato(q.c, r)) return;
          vista[k2] = 1; prec[k2] = kq; coda.push({ c: c, r: r });
        });
      }
      return null;
    }
    function vaiA(lista, poi) {
      var da = { c: Math.max(0, Math.min(D.w - 1, Math.floor(av.u))), r: Math.max(0, Math.min(D.h - 1, Math.floor(av.v))) };
      var p = strada(da, lista.filter(function (q) { return !occupato(q.c, q.r); }));
      if (!p) { dimmi("Da qui non ci arrivo 🤔"); return false; }
      av.strada = p.slice(1).map(function (q) { return { u: q.c + .5, v: q.r + .5 }; });
      av.poi = poi || null; av.fa = null; sporco = true; return true;
    }
    function intorno(o) {   // le mattonelle davanti a un oggetto da cui lo si può usare (senza un muro in mezzo)
      var b = box(o), l = [], c, r;
      for (c = b.c0; c < b.c1; c++) { if (passa(c, b.r0, c, b.r0 - 1)) l.push({ c: c, r: b.r0 - 1 }); if (passa(c, b.r1 - 1, c, b.r1)) l.push({ c: c, r: b.r1 }); }
      for (r = b.r0; r < b.r1; r++) { if (passa(b.c0, r, b.c0 - 1, r)) l.push({ c: b.c0 - 1, r: r }); if (passa(b.c1 - 1, r, b.c1, r)) l.push({ c: b.c1, r: r }); }
      return l.filter(function (q) { return !fuoriLotto(q.c, q.r); });
    }

    // ---- le modalità ----
    var modo = "vivi", scelto = null, fantasma = null, posa = null, attrezzo = "muro", sceltaKit = {}, tuttaStanza = false;
    function cambiaModo(m) {
      modo = m; scelto = null; fantasma = null; posa = null; tracciato = null;
      s.classList.toggle("gd-costr", m === "costruisci"); s.classList.toggle("gd-sistema", m === "sistema");
      bCostr.textContent = m === "costruisci" ? "✅ Fatto" : "🔨 Costruisci"; bSistema.textContent = m === "sistema" ? "✅ Fatto" : "✏️ Sistema";
      if (m === "costruisci" && !cambiaModo.detto) { cambiaModo.detto = 1; dimmi("Muri: trascina il dito sul terreno. Due dita per spostare la vista"); }
      barraSistema(); pannelloCostruisci(); sporco = true;
    }
    function vistaDentro() { return modo !== "vivi" || !!posa || dentro(Math.floor(av.u), Math.floor(av.v)); }

    // ---- toccare: col dito si sposta la vista (o si costruisce); un tocco fermo sceglie ----
    var dita = {}, tocco = null, pinza = null, tracciato = null, pennellata = null;
    function punto(e) { var bb = cv.getBoundingClientRect(); return { x: e.clientX - bb.left, y: e.clientY - bb.top }; }
    cv.addEventListener("pointerdown", function (e) {
      if (sopra.classList.contains("su")) return;
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      dita[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(dita);
      if (ids.length === 2) { var a = dita[ids[0]], b = dita[ids[1]]; pinza = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; tocco = null; tracciato = null; pennellata = null; sporco = true; return; }
      var p = punto(e);
      tocco = { x0: e.clientX, y0: e.clientY, x: p.x, y: p.y, mosso: false, ox: ox, oy: oy, trascina: null };
      if (modo === "costruisci" && attrezzo === "muro") { var g = schermoW(p.x, p.y); tracciato = { a: [Math.round(g[0]), Math.round(g[1])], b: [Math.round(g[0]), Math.round(g[1])] }; sporco = true; }
      if (modo === "costruisci" && attrezzo === "pavimento" && !tuttaStanza) { pennellata = { fatte: {}, speso: 0, salvato: false }; dipingiTerra(p.x, p.y); }
      if (modo === "sistema" && scelto) { var o = scelto.muro ? (facciaIn(p.x, p.y) && appesoSu(facciaIn(p.x, p.y)) === scelto ? scelto : null) : cosaQui(p.x, p.y); if (o === scelto) tocco.trascina = { o: o }; }
    });
    cv.addEventListener("pointermove", function (e) {
      if (!dita[e.pointerId]) return;
      dita[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(dita);
      if (pinza && ids.length === 2) {   // due dita: ingrandisci e sposta
        var a = dita[ids[0]], b = dita[ids[1]], bb = cv.getBoundingClientRect(), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ox += mx - pinza.mx; oy += my - pinza.my; pinza.mx = mx; pinza.my = my;
        zooma(pinza.z * Math.hypot(a.x - b.x, a.y - b.y) / pinza.d, mx - bb.left, my - bb.top); limita(); sporco = true; return;
      }
      if (!tocco) return;
      var dx = e.clientX - tocco.x0, dy = e.clientY - tocco.y0, p = punto(e);
      if (!tocco.mosso && Math.hypot(dx, dy) < 9) return;
      tocco.mosso = true;
      if (tracciato) { var g = schermoW(p.x, p.y); tracciato.b = [Math.round(g[0]), Math.round(g[1])]; sporco = true; return; }
      if (pennellata) { dipingiTerra(p.x, p.y); return; }
      if (tocco.trascina) {   // sposto la cosa scelta: segue il dito, a scatti di mattonella
        var o = tocco.trascina.o;
        if (o.muro) { var fz = facciaIn(p.x, p.y); fantasma = fz ? { muroDi: o, fz: fz } : null; sporco = true; return; }
        var g2 = schermoW(p.x, p.y), f = fpMondo(o);
        fantasma = { t: o.t, c: Math.floor(g2[0] - f[0] / 2 + .5), r: Math.floor(g2[1] - f[1] / 2 + .5), d: o.d || 0, salta: o, o: o, col: o.col };
        sporco = true; return;
      }
      ox = tocco.ox + dx; oy = tocco.oy + dy; limita(); sporco = true;
    });
    function suSu(e) {
      delete dita[e.pointerId];
      if (pinza) { if (Object.keys(dita).length < 2) pinza = null; tocco = null; return; }
      var t = tocco; tocco = null; if (!t) return;
      if (tracciato) { var tr = tracciato; tracciato = null; if (t.mosso) costruisciMuri(tr); else dimmi("Trascina il dito per tracciare il muro 🧱"); sporco = true; return; }
      if (pennellata) { pennellata = null; return; }
      if (t.trascina) {
        var o = t.trascina.o;
        if (t.mosso && fantasma) {
          if (o.muro) { var fz = fantasma.fz; if (fz && !appesoSu(fz) && !(D.muri[fz.k] && D.muri[fz.k].ap)) { o.muro = fz.k; o.lato = fz.sv; suonoPosa(); salva(); } else dimmi("Lì non ci sta 🚫"); }
          else if (libero(fantasma.t, fantasma.c, fantasma.r, fantasma.d, o)) { o.c = fantasma.c; o.r = fantasma.r; suonoPosa(); vibra(12); salva(); sfondo = tipoDi(o.t) === "terra" ? null : sfondo; }
          else dimmi("Lì non ci sta 🚫");
        }
        fantasma = null; sporco = true; if (t.mosso) return;
      }
      if (!t.mosso) tocca(t.x, t.y);
    }
    cv.addEventListener("pointerup", suSu); cv.addEventListener("pointercancel", suSu);
    cv.addEventListener("wheel", function (e) { e.preventDefault(); var p = punto(e); zooma(zoom * (e.deltaY < 0 ? 1.1 : .9), p.x, p.y); }, { passive: false });

    function cosaQui(x, y) {   // la cosa toccata: prima quella davanti (anche la chioma degli alberi)
      for (var i = ordinati.length - 1; i >= 0; i--) {
        var q = ordinati[i], o = q.o; if (!o || q.fantasma) continue;
        var R = q.ret; if (!R) continue;
        if (x >= R.x + R.w * .18 && x <= R.x + R.w * .82 && y >= R.y + R.h * .08 && y <= R.y + R.h) return o;
      }
      var g = schermoW(x, y); return oggettoIn(Math.floor(g[0]), Math.floor(g[1]));
    }
    function dentroPoligono(p, poly) { var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) { var a = poly[i], b = poly[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }
    function facciaIn(x, y) {   // il muro toccato (la faccia che si vede), dal più vicino; con un po' di margine
      var p = { x: x, y: y }, i;
      for (i = facce.length - 1; i >= 0; i--) if (dentroPoligono(p, facce[i].poly)) return facce[i];
      for (i = facce.length - 1; i >= 0; i--) { var f = facce[i].poly, cx = (f[0].x + f[1].x) / 2, cy = (f[0].y + f[1].y) / 2; if (Math.hypot(x - cx, y - cy) < TW * .35) return facce[i]; }
      return null;
    }
    function appesoSu(fz) { for (var i = 0; i < D.ogg.length; i++) { var o = D.ogg[i]; if (o.muro === fz.k && o.lato === fz.sv) return o; } return null; }
    function tocca(x, y) {
      if (modo === "costruisci") return toccaCostruisci(x, y);
      if (posa) return posaQui(x, y);
      var o = cosaQui(x, y);
      if (modo === "sistema") { if (!o) { var fz = facciaIn(x, y); o = fz ? appesoSu(fz) : null; } scegli(o); return; }
      if (o) { vibra(10); return vaiAOggetto(o); }
      var g = schermoW(x, y), c = Math.floor(g[0]), r = Math.floor(g[1]);
      if (fuoriLotto(c, r)) return;
      vibra(8); vaiA([{ c: c, r: r }], null);
    }
    function vaiAOggetto(o) {
      var l = intorno(o);
      l.sort(function (a, b) { return Math.hypot(a.c + .5 - av.u, a.r + .5 - av.v) - Math.hypot(b.c + .5 - av.u, b.r + .5 - av.v); });
      if (l.some(function (q) { return q.c === Math.floor(av.u) && q.r === Math.floor(av.v); })) { girati(o); return azione(o); }
      vaiA(l, function () { girati(o); azione(o); });
    }
    function girati(o) { var b = box(o); av.fw = [(b.c0 + b.c1) / 2 - av.u, (b.r0 + b.r1) / 2 - av.v]; sporco = true; }

    // ---- cosa si fa con le piante (e coi mobili) ----
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
      dimmi(nomeDi(o.t));
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
      var b = box(o), p = pw((b.c0 + b.c1) / 2, (b.r0 + b.r1) / 2);
      for (var i = 0; i < Math.min(n, 8); i++) volano.push({ x: p.x + (Math.random() - .5) * TW * .5, y: p.y - TW * (A ? 1 : .3), vx: (Math.random() - .5) * 2, vy: -2.5 - Math.random() * 2, t: 0, e: FRUTTI[f][2] });
      dimmi("+" + n + " " + FRUTTI[f][2] + " " + (n === 1 ? FRUTTI[f][0] : FRUTTI[f][1]) + " nel cesto");
      av.fa = "raccogli"; av.ft = 0; sporco = true;
    }

    // ---- le finestre sopra (schede, negozio, cesto, baule) ----
    function svuota() { while (sopra.firstChild) sopra.removeChild(sopra.firstChild); }
    function chiudiSopra() { sopra.classList.remove("su"); }
    function finestra(tit, nodi, tasti, cls) {
      svuota(); var box2 = el("div", "gd-carta" + (cls ? " " + cls : "")); if (tit) box2.appendChild(el("h2", null, tit));
      nodi.forEach(function (n) { if (n) box2.appendChild(n); });
      var tt = el("div", "gd-tasti"); (tasti || []).forEach(function (x) { var b = el("button", "btn " + (x.cls || "btn-fantasma"), x.testo); b.onclick = function () { vibra(10); x.fn(); }; if (x.off) b.disabled = true; tt.appendChild(b); }); box2.appendChild(tt);
      sopra.appendChild(box2); sopra.classList.add("su");
    }
    sopra.addEventListener("pointerdown", function (e) { if (e.target === sopra) chiudiSopra(); });
    function figura(nome, px) {   // un disegno (giardino o mobile) come immagine, per le schede
      var i = el("img", "gd-fig"), M = window.SGMobiliArte, A = window.SGGiardinoArte; i.alt = ""; i.style.width = i.style.height = px + "px";
      try { var src = M && M.info && M.info(nome) ? M.svg(nome, {}) : A && A.info && A.info(nome) ? A.svg(nome, {}) : null; if (src) i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src); } catch (e) {}
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
          if (monete() < S.seme) return; vibra(12); paga(S.seme);
          o.pianta = k; o.cresci = 0; o.acqua = 0; o.agg = Date.now(); salva(); chiudiSopra(); suonoPosa(); sporco = true;
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
        var b = el("button", "gd-vendi", "🪙 " + cifre(v)); b.onclick = function () { vibra(10); paga(-v); D.cesto[f] = 0; suonoMonete(); salva(); aggTesta(); cesto(); };
        r.appendChild(b); l.appendChild(r);
      });
      if (!tot) nodi.push(el("p", "gd-frase", "Il cesto è vuoto. Quando gli alberi fanno i frutti, o l'orto è pronto, toccali per raccogliere."));
      else nodi.push(l);
      finestra("🧺 Il cesto", nodi, [
        { testo: "Vendi tutto · 🪙 " + cifre(tot), cls: "btn-primario", off: !tot, fn: function () { paga(-tot); D.cesto = {}; suonoMonete(); salva(); aggTesta(); chiudiSopra(); dimmi("Venduto tutto! +🪙 " + cifre(tot)); } },
        { testo: "Chiudi", fn: chiudiSopra }]);
    }
    function reparti() {   // le schede del negozio: il giardino, poi i mobili per stanza, poi il terreno
      var l = NEGOZIO.slice(), M = window.SGMobiliArte, per = {};
      try { (M && M.nomi ? M.nomi() : []).forEach(function (t) { var i = M.info(t); if (!i) return; var st = i.stanza || "casa"; (per[st] = per[st] || []).push({ t: t, nome: i.nome || t, prezzo: i.prezzo || COSTO.mobile }); }); } catch (e) {}
      Object.keys(per).forEach(function (st) { l.push({ cat: STANZE[st] || st, voci: per[st] }); });
      l.push({ cat: "Terreno", terreno: true });
      return l;
    }
    var catNegozio = 0;
    function negozio() {
      if (modo !== "vivi") cambiaModo("vivi");
      var R = reparti(), schede = el("div", "gd-schede"), lista = el("div", "gd-griglia"), nodi = [schede, lista];
      if (catNegozio >= R.length) catNegozio = 0;
      R.forEach(function (g, i) { var b = el("button", "gd-scheda" + (i === catNegozio ? " on" : ""), g.cat); b.onclick = function () { vibra(8); catNegozio = i; negozio(); }; schede.appendChild(b); });
      var g = R[catNegozio];
      if (!g.terreno) g.voci.forEach(function (v) {
        var b = el("button", "gd-voce"), nm = ALBERI[v.t] ? "albero_" + v.t + "_2" : v.t === "orto" ? "orto_carota_2" : v.t;
        b.appendChild(figura(nm, 64)); b.appendChild(el("b", null, v.nome)); b.appendChild(el("small", null, "🪙 " + cifre(v.prezzo) + (v.sotto ? " · " + v.sotto : "")));
        if (monete() < v.prezzo) b.classList.add("caro");
        b.onclick = function () {
          if (monete() < v.prezzo) { dimmi("Ti mancano 🪙 " + cifre(v.prezzo - monete())); return; }
          vibra(12); paga(v.prezzo); D.baule[v.t] = (D.baule[v.t] || 0) + 1; salva(); suonoMonete();
          chiudiSopra(); iniziaPosa(v.t);
        };
        lista.appendChild(b);
      });
      else {   // allargare il terreno
        var prossimo = ALLARGA.filter(function (a) { return a.a > D.w; })[0];
        nodi = [schede, el("p", "gd-frase", "Il tuo terreno è di " + D.w + " × " + D.h + " mattonelle."),
          prossimo ? el("p", "gd-nota", "Allargandolo diventa " + prossimo.a + " × " + prossimo.a + ": più spazio per la casa, gli alberi e l'orto.") : el("p", "gd-nota", "È già il più grande che c'è! 🏞️")];
        if (prossimo) return finestra("🛒 Compra", nodi, [{ testo: "Allarga · 🪙 " + cifre(prossimo.prezzo), cls: "btn-primario", off: monete() < prossimo.prezzo, fn: function () {
          if (monete() < prossimo.prezzo) return; paga(prossimo.prezzo); D.w = D.h = prossimo.a; calcolaStanze(); VICINI = null; salva(); suonoMonete(); chiudiSopra(); sfondo = null; sporco = true; dimmi("Terreno allargato! 🏞️"); } }, { testo: "Chiudi", fn: chiudiSopra }], "gd-larga");
      }
      finestra("🛒 Compra", nodi, [{ testo: "Chiudi", fn: chiudiSopra }], "gd-larga");
    }

    // ---- "Sistema": scegli, sposti col dito, giri, metti nel baule o rivendi; il baule per rimettere le cose ----
    var posaDaSis = false;
    function scegli(o) { scelto = o; sporco = true; barraSistema(); if (o) vibra(10); }
    function barraSistema() {
      while (barra.firstChild) barra.removeChild(barra.firstChild);
      barra.classList.toggle("su", modo === "sistema" || !!posa);
      if (posa) {
        var tp = tipoDi(posa.t);
        barra.appendChild(el("span", "gd-sis-t", tp === "parete" ? "Tocca un muro per appendere: " + nomeDi(posa.t).toLowerCase() : TERRA[posa.t] ? "Tocca le mattonelle: " + nomeDi(posa.t).toLowerCase() : "Tocca dove mettere: " + nomeDi(posa.t).toLowerCase()));
        if (tp === "piedi") { var bG = el("button", "gd-sis-b", "↻"); bG.setAttribute("aria-label", "Gira"); bG.onclick = function () { vibra(8); posa.d = ((posa.d || 0) + 1) % 4; dimmi("Girato ↻"); }; barra.appendChild(bG); }
        var bF = el("button", "gd-sis-b", TERRA[posa.t] ? "✅ Fatto" : "✖"); bF.setAttribute("aria-label", "Basta"); bF.onclick = function () { vibra(8); finePosa(); }; barra.appendChild(bF); return;
      }
      if (modo !== "sistema") return;
      if (!scelto) { barra.appendChild(el("span", "gd-sis-t", "Tocca una cosa per spostarla")); var bB = el("button", "gd-sis-b", "🎒 Baule" + (contaBaule() ? " (" + contaBaule() + ")" : "")); bB.onclick = function () { vibra(8); baule(); }; barra.appendChild(bB); return; }
      barra.appendChild(el("span", "gd-sis-t", nomeDi(scelto.t) + " · trascinala col dito"));
      if (!scelto.muro && tipoDi(scelto.t) === "piedi") { var bR = el("button", "gd-sis-b", "↻"); bR.setAttribute("aria-label", "Gira"); bR.onclick = function () { vibra(8); giraOggetto(scelto); }; barra.appendChild(bR); }
      var bM = el("button", "gd-sis-b", "🎒"); bM.setAttribute("aria-label", "Nel baule");
      bM.onclick = function () { vibra(10); if (scelto.t === "orto" && scelto.pianta) { dimmi("Prima raccogli quello che c'è 🌱"); return; } togli(scelto); D.baule[scelto.t] = (D.baule[scelto.t] || 0) + 1; scegli(null); salva(); };
      var resa = Math.floor(prezzoDi(scelto.t) / 2), bV = el("button", "gd-sis-b", "🪙 " + cifre(resa));
      bV.onclick = function () {
        if (bV.dataset.sicuro !== "1") { bV.dataset.sicuro = "1"; bV.textContent = "Vendo? 🪙 " + cifre(resa); return; }
        vibra(12); paga(-resa); togli(scelto); suonoMonete(); scegli(null); salva();
      };
      [bM, bV].forEach(function (b) { barra.appendChild(b); });
    }
    function giraOggetto(o) {
      for (var i = 1; i <= 3; i++) { var d = ((o.d || 0) + i) % 4; if (libero(o.t, o.c, o.r, d, o)) { o.d = d; salva(); suonoPosa(); sporco = true; return; } }
      dimmi("Non c'è spazio per girarlo 🚫");
    }
    function togli(o) { D.ogg = D.ogg.filter(function (x) { return x !== o; }); sfondo = null; sporco = true; }
    function contaBaule() { var n = 0; for (var k in D.baule) n += D.baule[k]; return n; }
    function baule() {
      var lista = el("div", "gd-griglia");
      Object.keys(D.baule).forEach(function (t) {
        var n = D.baule[t]; if (!n) return;
        var b = el("button", "gd-voce"); b.appendChild(figura(ALBERI[t] ? "albero_" + t + "_0" : t, 64)); b.appendChild(el("b", null, nomeDi(t))); b.appendChild(el("small", null, "× " + n));
        b.onclick = function () { vibra(10); chiudiSopra(); iniziaPosa(t); }; lista.appendChild(b);
      });
      finestra("🎒 Il baule", [contaBaule() ? lista : el("p", "gd-frase", "Il baule è vuoto. Le cose che compri o che togli finiscono qui.")], [{ testo: "Chiudi", fn: chiudiSopra }], "gd-larga");
    }
    function finePosa() { var tornaSis = posaDaSis; posa = null; fantasma = null; posaDaSis = false; sporco = true; if (tornaSis) cambiaModo("sistema"); else barraSistema(); }
    function iniziaPosa(t) { if (!D.baule[t]) return; posaDaSis = modo === "sistema"; modo = "vivi"; s.classList.remove("gd-sistema", "gd-costr"); bSistema.textContent = "✏️ Sistema"; bCostr.textContent = "🔨 Costruisci"; pannelloCostruisci(); posa = { t: t, d: 0 }; scelto = null; barraSistema(); sporco = true; dimmi(tipoDi(t) === "parete" ? "Tocca un muro 👇" : "Tocca dove metterlo 👇"); }
    function posaQui(x, y) {
      var t = posa.t, o;
      if (tipoDi(t) === "parete") {
        var fz = facciaIn(x, y);
        if (!fz || appesoSu(fz) || (D.muri[fz.k] && D.muri[fz.k].ap)) { dimmi("Scegli un pezzo di muro libero 🚫"); vibra(30); return; }
        o = { k: ++D.ultimo, t: t, muro: fz.k, lato: fz.sv };
      } else {
        var g = schermoW(x, y), f = fpDi(t); if (posa.d % 2) f = [f[1], f[0]];
        var c = Math.floor(g[0]) - Math.floor((f[0] - 1) / 2), r = Math.floor(g[1]) - Math.floor((f[1] - 1) / 2);
        if (!libero(t, c, r, posa.d)) { fantasma = { t: t, c: c, r: r, d: posa.d }; sporco = true; dimmi("Lì non ci sta 🚫"); vibra(30); return; }
        o = { k: ++D.ultimo, t: t, c: c, r: r, d: posa.d };
        if (ALBERI[t]) { o.cresci = 0; o.fr = 0; o.acqua = 0; o.agg = Date.now(); }
      }
      D.ogg.push(o); D.baule[t]--; if (!D.baule[t]) delete D.baule[t];
      suonoPosa(); vibra(15); salva(); fantasma = null; if (tipoDi(t) === "terra") sfondo = null; sporco = true;
      if (ALBERI[t]) dimmi("Piantato! Annaffialo per farlo crescere 💧");
      if (!TERRA[t] || !D.baule[t]) return finePosa();
      barraSistema();
    }

    // ---- "Costruisci": muri, porte, finestre, pareti, pavimenti, tetto, demolisci (e annulla) ----
    var ATTREZZI = [["muro", "🧱 Muri"], ["porta", "🚪 Porte"], ["finestra", "🪟 Finestre"], ["pareti", "🎨 Pareti"], ["pavimento", "🟫 Pavimenti"], ["tetto", "🏠 Tetto"], ["demolisci", "💥 Togli"]];
    var annulla = [];
    function ricorda(speso) { annulla.push({ muri: JSON.stringify(D.muri), pav: JSON.stringify(D.pav), tetto: D.tetto, speso: speso || 0 }); if (annulla.length > 30) annulla.shift(); }
    function disfa() {
      var u = annulla.pop(); if (!u) { dimmi("Niente da annullare"); return; }
      D.muri = JSON.parse(u.muri); D.pav = JSON.parse(u.pav); D.tetto = u.tetto; if (u.speso) paga(-u.speso);
      dopoLavori(); dimmi("Annullato ↩︎"); pannelloCostruisci();
    }
    function dopoLavori() { calcolaStanze(); sfondo = null; sporco = true; salva(); }
    function prezzoKit(gruppo, id) { var v = voceKit(gruppo, id); if (v && v.prezzo) return v.prezzo; if (gruppo === "porte") return COSTO.porta; if (gruppo === "finestre") return COSTO.finestra; if (gruppo === "pavimenti") return COSTO.pavimento; if (gruppo === "tetti") return COSTO.tetto; return v && /carta|piastrel|boiserie|perlin|matton|pietra|legno|tronch|doghe|pannell/.test(v.id + v.nome) ? COSTO.carta : COSTO.pittura; }
    var GRUPPO = { porta: "porte", finestra: "finestre", pareti: "muri", pavimento: "pavimenti", tetto: "tetti" };
    function pannelloCostruisci() {
      while (attrezzi.firstChild) attrezzi.removeChild(attrezzi.firstChild);
      attrezzi.classList.toggle("su", modo === "costruisci");
      if (modo !== "costruisci") return;
      var riga = el("div", "gd-strum");
      ATTREZZI.forEach(function (a) { var b = el("button", "gd-str" + (attrezzo === a[0] ? " on" : ""), a[1]); b.onclick = function () { vibra(8); attrezzo = a[0]; tuttaStanza = false; pannelloCostruisci(); sporco = true; }; riga.appendChild(b); });
      var bU = el("button", "gd-str", "↩︎"); bU.setAttribute("aria-label", "Annulla"); bU.onclick = function () { vibra(8); disfa(); }; riga.appendChild(bU);
      attrezzi.appendChild(riga);
      var sc = el("div", "gd-scelte"), gr = GRUPPO[attrezzo];
      if (attrezzo === "muro") sc.appendChild(el("p", "gd-sc-t", "Trascina il dito sul terreno da un angolo all'altro · 🪙 " + COSTO.muro + " a pezzo. Due dita per spostare la vista, ↻ in alto per girarla."));
      else if (attrezzo === "demolisci") sc.appendChild(el("p", "gd-sc-t", "Tocca un muro per toglierlo (prima la porta o la finestra), o un pavimento fuori. I muri ti ridanno i soldi."));
      else {
        if (attrezzo === "pareti" || attrezzo === "pavimento") { var bT = el("button", "gd-sc gd-sc-tutta" + (tuttaStanza ? " on" : ""), tuttaStanza ? "✓ Tutta la stanza" : "Tutta la stanza"); bT.onclick = function () { vibra(8); tuttaStanza = !tuttaStanza; pannelloCostruisci(); }; sc.appendChild(bT); }
        var l = listaKit(gr);
        if (!l.length) sc.appendChild(el("p", "gd-sc-t", "I materiali arrivano presto 🏗️"));
        if (!sceltaKit[gr] && l[0]) sceltaKit[gr] = l[0].id;
        l.forEach(function (v) {
          var b = el("button", "gd-sc" + (sceltaKit[gr] === v.id ? " on" : "")), im = el("img"); im.alt = "";
          try { im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(v.svg({})); } catch (e) {}
          if (gr === "porte" || gr === "finestre") im.className = "gd-sc-alto";
          b.appendChild(im); b.appendChild(el("span", null, v.nome)); b.appendChild(el("small", null, "🪙 " + cifre(prezzoKit(gr, v.id))));
          b.onclick = function () { vibra(8); sceltaKit[gr] = v.id; if (attrezzo === "tetto") return mettiTetto(v.id); pannelloCostruisci(); };
          sc.appendChild(b);
        });
      }
      attrezzi.appendChild(sc);
    }
    function costruisciMuri(tr) {
      var pz = pezziTracciato(tr); if (!pz.length) { dimmi("Qui non si può fare un muro 🚫"); return; }
      var costo = pz.length * COSTO.muro;
      if (monete() < costo) { dimmi("Ti mancano 🪙 " + cifre(costo - monete())); vibra(30); return; }
      ricorda(costo); pz.forEach(function (p) { D.muri[chiave(p[0], p[1], p[2])] = { s: [null, null], ap: null }; });
      paga(costo); suonoMuro(); vibra(15); dopoLavori();
      dimmi(pz.length + (pz.length === 1 ? " pezzo di muro" : " pezzi di muro") + " · 🪙 " + cifre(costo));
    }
    function pezziTracciato(t) {   // i pezzi di muro tra due angoli, in linea retta lungo il lato più lungo
      var a = t.a, b = t.b, l = [], i;
      if (Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1])) { for (i = Math.min(a[0], b[0]); i < Math.max(a[0], b[0]); i++) l.push(["b", i, a[1]]); }
      else { for (i = Math.min(a[1], b[1]); i < Math.max(a[1], b[1]); i++) l.push(["a", a[0], i]); }
      return l.filter(function (p) { return muroPossibile(p[0], p[1], p[2]) && !muro(p[0], p[1], p[2]); });
    }
    function toccaCostruisci(x, y) {
      var fz = facciaIn(x, y), gr = GRUPPO[attrezzo], id = sceltaKit[gr];
      if (attrezzo === "muro") return dimmi("Trascina il dito per tracciare il muro 🧱");
      if (attrezzo === "tetto") return dimmi("Scegli il tetto qui sotto 👇");
      if (attrezzo === "pavimento") { if (tuttaStanza) return pavimentaStanza(x, y); return; }
      if (attrezzo === "demolisci") {
        if (fz) {
          var m = D.muri[fz.k];
          if (m.ap) { ricorda(0); var resa = Math.floor(prezzoKit(m.ap.t === "porta" ? "porte" : "finestre", m.ap.id) / 2); m.ap = null; paga(-resa); suonoMuro(); dopoLavori(); return dimmi("Tolta · +🪙 " + cifre(resa)); }
          ricorda(-COSTO.muro); delete D.muri[fz.k];
          D.ogg.filter(function (o) { return o.muro === fz.k; }).forEach(function (o) { togli(o); D.baule[o.t] = (D.baule[o.t] || 0) + 1; });
          paga(-COSTO.muro); suonoMuro(); dopoLavori(); return dimmi("Muro tolto · +🪙 " + COSTO.muro);
        }
        var g = schermoW(x, y), kk = Math.floor(g[0]) + "," + Math.floor(g[1]);
        if (D.pav[kk] && !dentro(Math.floor(g[0]), Math.floor(g[1]))) { ricorda(0); delete D.pav[kk]; dopoLavori(); return dimmi("Pavimento tolto"); }
        return;
      }
      if (!fz) return dimmi("Tocca un muro 🧱");
      var mm = D.muri[fz.k];
      if (attrezzo === "porta" || attrezzo === "finestra") {
        if (!id) return;
        if (appesoSu(fz) || appesoSu({ k: fz.k, sv: 1 - fz.sv })) return dimmi("Prima togli quello che c'è appeso 🖼️");
        if (mm.ap && mm.ap.t === attrezzo && mm.ap.id === id) return;
        var p = prezzoKit(gr, id); if (monete() < p) return dimmi("Ti mancano 🪙 " + cifre(p - monete()));
        ricorda(p); mm.ap = { t: attrezzo, id: id }; paga(p); suonoPosa(); vibra(12); dopoLavori(); return;
      }
      if (attrezzo === "pareti" && id) {
        var lista = [[fz.k, fz.sv]];
        if (tuttaStanza) { var t0 = lati(fz.k)[fz.sv], st0 = stanza(t0[0], t0[1]); lista = [];
          Object.keys(D.muri).forEach(function (k) { var ll = lati(k); [0, 1].forEach(function (sd) { if (stanza(ll[sd][0], ll[sd][1]) === st0 && !fuoriLotto(ll[sd][0], ll[sd][1])) lista.push([k, sd]); }); }); }
        lista = lista.filter(function (q) { return D.muri[q[0]].s[q[1]] !== id; });
        if (!lista.length) return;
        var costo = lista.length * prezzoKit("muri", id); if (monete() < costo) return dimmi("Ti mancano 🪙 " + cifre(costo - monete()));
        ricorda(costo); lista.forEach(function (q) { D.muri[q[0]].s[q[1]] = id; }); paga(costo); suonoPosa(); vibra(12); dopoLavori();
        if (lista.length > 1) dimmi("Dipinti " + lista.length + " pezzi · 🪙 " + cifre(costo));
      }
    }
    function dipingiTerra(x, y) {   // il pavimento col dito, mattonella per mattonella
      var id = sceltaKit.pavimenti, g = schermoW(x, y), c = Math.floor(g[0]), r = Math.floor(g[1]), k = c + "," + r;
      if (!id || fuoriLotto(c, r) || pennellata.fatte[k] || D.pav[k] === id) return;
      var p = prezzoKit("pavimenti", id); if (monete() < p) { dimmi("Ti mancano 🪙 " + cifre(p - monete())); return; }
      if (!pennellata.salvato) { ricorda(0); pennellata.salvato = true; }
      pennellata.fatte[k] = 1; D.pav[k] = id; paga(p); annulla[annulla.length - 1].speso += p; sfondo = null; sporco = true; salva();
    }
    function pavimentaStanza(x, y) {
      var id = sceltaKit.pavimenti, g = schermoW(x, y), st0 = stanza(Math.floor(g[0]), Math.floor(g[1])); if (!id) return;
      if (!st0) return dimmi("Tocca dentro una stanza 🏠");
      var l = []; for (var c = 0; c < D.w; c++) for (var r = 0; r < D.h; r++) if (stanza(c, r) === st0 && D.pav[c + "," + r] !== id) l.push(c + "," + r);
      if (!l.length) return;
      var costo = l.length * prezzoKit("pavimenti", id); if (monete() < costo) return dimmi("Ti mancano 🪙 " + cifre(costo - monete()));
      ricorda(costo); l.forEach(function (k) { D.pav[k] = id; }); paga(costo); suonoPosa(); vibra(12); dopoLavori(); dimmi("Pavimento nuovo · 🪙 " + cifre(costo));
    }
    function mettiTetto(id) {
      if (D.tetto === id) return pannelloCostruisci();
      var p = prezzoKit("tetti", id); if (monete() < p) { pannelloCostruisci(); return dimmi("Ti mancano 🪙 " + cifre(p - monete())); }
      ricorda(p); D.tetto = id; paga(p); suonoPosa(); dopoLavori(); pannelloCostruisci(); dimmi("Tetto nuovo! Esci in Vivi per vederlo 🏠");
    }

    // =========================================================
    //  IL DISEGNO
    // =========================================================
    var FASE = fase(), volano = [], tAnim = 0, ordinati = [], facce = [];
    var PAL = { giorno: { fuori: "#7fb35a", prato: "#95c962", prato2: "#8bbf58", buio: 0 },
      tramonto: { fuori: "#86a352", prato: "#9cbf5c", prato2: "#93b655", buio: .16, velo: "120,60,50" },
      notte: { fuori: "#557d4c", prato: "#6f9c57", prato2: "#689452", buio: .4, velo: "12,18,48" } };
    function pal() { return PAL[FASE] || PAL.giorno; }
    function poligono(c, pts, fill, stroke, lw) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); } }
    function stendi(c, im, P, x0, y0, n, m) {   // un disegno piatto (100 per mattonella) steso a terra sulle mattonelle x0…x0+n, y0…y0+m del mondo
      var a = P(x0, y0), b = P(x0 + n, y0), d = P(x0, y0 + m);
      c.save(); c.transform((b.x - a.x) / (100 * n), (b.y - a.y) / (100 * n), (d.x - a.x) / (100 * m), (d.y - a.y) / (100 * m), a.x, a.y); c.drawImage(im, 0, 0, 100 * n, 100 * m); c.restore();
    }
    function disegnaSfondo() {   // il prato, i pavimenti e le cose piatte: fermi, in una tela a parte (si rifà quando cambiano)
      var c = document.createElement("canvas"), W = D.w, H = D.h, pad = TW * 2;
      var L = (VW() + VH()) * TW / 2 + pad * 2, A = (VW() + VH()) * TW / 4 + pad * 2; c.width = Math.round(L * dpr); c.height = Math.round(A * dpr);
      var x = c.getContext("2d"), P = pal(), r = rnd(4242), i, cc, rr; x.scale(dpr, dpr);
      var o0 = { x: VH() * TW / 2 + pad, y: pad };
      function pS(a, b) { var v = rv(a, b); return { x: o0.x + (v[0] - v[1]) * TW / 2, y: o0.y + (v[0] + v[1]) * TW / 4 }; }
      function rombo(a, b, n, m) { return [pS(a, b), pS(a + n, b), pS(a + n, b + m), pS(a, b + m)]; }
      // il bordo (un gradino di terra) e il prato tagliato a righe
      x.save(); x.translate(0, TW * .12); poligono(x, rombo(0, 0, W, H), "rgba(60,40,20,.35)"); x.restore();
      poligono(x, rombo(0, 0, W, H), P.prato);
      for (rr = 0; rr < H; rr++) if (rr % 2) poligono(x, rombo(0, rr, W, 1), P.prato2);
      for (i = 0; i < W * H * 1.4; i++) {   // ciuffi d'erba e qualche fiorellino
        var gx = r() * W, gy = r() * H, q = pS(gx, gy), fiore = r() < .08, col = Math.floor(r() * 3), dx = (r() - .5) * 3;
        if (dentro(Math.floor(gx), Math.floor(gy))) continue;
        if (fiore) { x.fillStyle = ["#fff", "#ffe066", "#f783ac"][col]; x.globalAlpha = FASE === "notte" ? .35 : .85; x.beginPath(); x.arc(q.x, q.y, TW * .018 + .6, 0, 6.29); x.fill(); x.globalAlpha = 1; }
        else { x.strokeStyle = dx > 0 ? "rgba(40,90,30,.35)" : "rgba(220,255,180,.3)"; x.lineWidth = 1; x.beginPath(); x.moveTo(q.x, q.y); x.lineTo(q.x + dx, q.y - TW * .05); x.stroke(); }
      }
      // i pavimenti (dentro sempre, fuori se messi apposta)
      for (cc = 0; cc < W; cc++) for (rr = 0; rr < H; rr++) {
        var k = cc + "," + rr, dn = dentro(cc, rr); if (!dn && !D.pav[k]) continue;
        var id = D.pav[k] || defPav(), im = id ? texKit("pavimenti", id) : null;
        if (pronta(im)) stendi(x, im, pS, cc, rr, 1, 1); else poligono(x, rombo(cc, rr, 1, 1), dn ? ((cc + rr) % 2 ? "#c99a63" : "#bf8f58") : "#cfc8b8", "rgba(90,55,25,.3)");
      }
      // dentro: l'ombra morbida lungo i muri (l'angolo delle stanze)
      Object.keys(D.muri).forEach(function (k) { var ll = lati(k); [0, 1].forEach(function (sd) { var t = ll[sd]; if (!dentro(t[0], t[1])) return; var p = k.split(","), a = p[0] === "a" ? [+p[1], +p[2]] : [+p[1], +p[2]], b = p[0] === "a" ? [+p[1], +p[2] + 1] : [+p[1] + 1, +p[2]], dd = sd ? .14 : -.14, A2 = p[0] === "a" ? [[a[0], a[1]], [b[0], b[1]], [b[0] + dd, b[1]], [a[0] + dd, a[1]]] : [[a[0], a[1]], [b[0], b[1]], [b[0], b[1] + dd], [a[0], a[1] + dd]]; poligono(x, A2.map(function (z) { return pS(z[0], z[1]); }), "rgba(60,35,15,.13)"); }); });
      // le cose a terra: vialetti, ghiaia, tappeti
      D.ogg.forEach(function (o) {
        if (appeso(o) || tipoDi(o.t) !== "terra") return;
        var f = fpMondo(o);
        if (TERRA[o.t]) { var a = arteOgg(o.t), ce = pS(o.c + .5, o.r + .5), kk = TW / 100; if (a && pronta(a.im)) x.drawImage(a.im, ce.x - a.info.ax * kk, ce.y - a.info.ay * kk, a.info.w * kk, a.info.h * kk); else poligono(x, rombo(o.c + .06, o.r + .06, .88, .88), o.t === "ghiaia" ? "#d8d2c4" : "#c9c2b4"); return; }
        var am = arteOgg(o.t, false, false, o.col); if (am && pronta(am.im)) stendi(x, am.im, pS, o.c, o.r, f[0], f[1]); else poligono(x, rombo(o.c + .1, o.r + .1, f[0] - .2, f[1] - .2), "#e8789a");
      });
      return { c: c, o0: o0, L: L, A: A };
    }
    function dietroA(A, B) { return (A.c1 <= B.c0 + 1e-6 && A.r0 < B.r1 - 1e-6 && B.r0 < A.r1 + 1e-6) || (A.r1 <= B.r0 + 1e-6 && A.c0 < B.c1 - 1e-6 && B.c0 < A.c1 + 1e-6); }
    function prima(A, B) {   // A si disegna prima di B? (i muri della casa sempre prima del suo tetto)
      if (A.muro && B.tetto && A.casa) return true;
      if (A.tetto && B.muro && B.casa) return false;
      return dietroA(A.b, B.b);
    }
    function ordina(lista) {
      var n = lista.length, dopo = lista.map(function () { return []; }), conta = lista.map(function () { return 0; }), i, j;
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (i !== j && prima(lista[i], lista[j])) { dopo[i].push(j); conta[j]++; }
      var pronti = [], out = [], chiaveO = function (k) { var b = lista[k].b; return b.c0 + b.r0 + b.c1 + b.r1; };
      for (i = 0; i < n; i++) if (!conta[i]) pronti.push(i);
      while (pronti.length) {
        pronti.sort(function (a, b) { return chiaveO(a) - chiaveO(b); });
        var k = pronti.shift(); out.push(lista[k]);
        dopo[k].forEach(function (m) { if (!--conta[m]) pronti.push(m); });
      }
      if (out.length < n) lista.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });   // per sicurezza (se ci fosse un giro)
      return out;
    }
    function pezziMuro(dentroV) {   // i muri visti da qui: quale lato si vede, se sono abbassati
      var l = [], tutti = {};
      Object.keys(D.muri).forEach(function (k) {
        var m = D.muri[k], p = k.split(","), t = p[0], c = +p[1], r = +p[2];
        var q0 = rv(c, r), q1 = t === "a" ? rv(c, r + 1) : rv(c + 1, r), vt = q0[0] === q1[0] ? "a" : "b";
        var vx = Math.min(q0[0], q1[0]), vy = Math.min(q0[1], q1[1]), ll = lati(k), cen = rv(c + .5, r + .5);
        tutti[vt + "," + vx + "," + vy] = 1;
        var sv = (vt === "a" ? cen[0] > vx : cen[1] > vy) ? 1 : 0, fa = ll[sv], re = ll[1 - sv];
        var faD = dentro(fa[0], fa[1]), reD = dentro(re[0], re[1]);
        if (!dentroV && faD) return;   // da fuori le facce di dentro stanno sotto il tetto
        l.push({ muro: true, k: k, m: m, vt: vt, vx: vx, vy: vy, sv: sv, faD: faD, basso: dentroV && reD, casa: faD || reD,
          b: vt === "a" ? { c0: vx, c1: vx, r0: vy, r1: vy + 1 } : { c0: vx, c1: vx + 1, r0: vy, r1: vy } });
      });
      l.forEach(function (x) { x.fine = x.vt === "a" ? !tutti["a," + x.vx + "," + (x.vy + 1)] && !tutti["b," + (x.vx - 1) + "," + (x.vy + 1)] : !tutti["b," + (x.vx + 1) + "," + x.vy] && !tutti["a," + (x.vx + 1) + "," + (x.vy - 1)]; });
      return l;
    }
    function piega(im, L, R, h) {   // un disegno piatto 62×200 piegato sul muro (da L a R), tagliato all'altezza h
      var kz = TW / 100, sw = im.naturalWidth, sh = im.naturalHeight;
      ctx.save(); ctx.setTransform(dpr * (R.x - L.x) / 62, dpr * (R.y - L.y) / 62, 0, dpr * kz, dpr * L.x, dpr * (L.y - ALTO * kz));
      ctx.drawImage(im, 0, sh * (1 - h / ALTO), sw, sh * h / ALTO, 0, ALTO - h, 62, h); ctx.restore();
    }
    function disegnaMuro(x, appesi) {
      var kz = TW / 100, h = x.basso ? BASSO : ALTO, H = h * kz, L, R, off, notte = FASE === "notte";
      if (x.vt === "a") { L = pv(x.vx, x.vy + 1); R = pv(x.vx, x.vy); off = { x: -SPESS * TW / 2, y: -SPESS * TW / 4 }; }
      else { L = pv(x.vx, x.vy); R = pv(x.vx + 1, x.vy); off = { x: SPESS * TW / 2, y: -SPESS * TW / 4 }; }
      var Lt = { x: L.x, y: L.y - H }, Rt = { x: R.x, y: R.y - H }, faccia = [L, R, Rt, Lt];
      var mat = x.m.s[x.sv] || defMuro(x.faD), im = mat ? texKit("muri", mat) : null;
      if (pronta(im)) piega(im, L, R, h); else poligono(ctx, faccia, x.faD ? "#f4efe6" : "#f3e3c3");
      var ap = x.m.ap;
      if (ap) {
        var gr = ap.t === "porta" ? "porte" : "finestre", ia = texKit(gr, ap.id || (primoKit(gr) || {}).id, notte && !x.faD && ap.t === "finestra");
        if (pronta(ia)) piega(ia, L, R, h);
        else {   // senza disegno: un rettangolo
          var z0 = ap.t === "porta" ? 0 : 75, z1 = ap.t === "porta" ? 150 : 155, zt = Math.min(z1, h);
          if (z0 < h) { var q = function (u, z) { return { x: L.x + (R.x - L.x) * u, y: L.y + (R.y - L.y) * u - z * kz }; }; poligono(ctx, [q(.2, z0), q(.8, z0), q(.8, zt), q(.2, zt)], ap.t === "porta" ? "#7a4a22" : notte && !x.faD ? "#ffe8a3" : "#bfe3ff", "#5a3a1a"); }
        }
      }
      var ap2 = appesi[x.k + "|" + x.sv];
      if (ap2) { var a2 = arteOgg(ap2.t, false, false, ap2.col); if (a2 && pronta(a2.im)) piega(a2.im, L, R, h); else if (h > 120) { var q2 = function (u, z) { return { x: L.x + (R.x - L.x) * u, y: L.y + (R.y - L.y) * u - z * kz }; }; poligono(ctx, [q2(.25, 90), q2(.75, 90), q2(.75, 150), q2(.25, 150)], "#d0ebff", "#8a6a3a"); } }
      // luce e ombra: la faccia che guarda in basso a destra è più in ombra; in basso un'ombra morbida (disegnata "sul muro", così i pezzi combaciano)
      poligono(ctx, faccia, x.vt === "a" ? "rgba(40,25,10,.17)" : "rgba(255,248,235,.05)");
      ctx.save(); ctx.setTransform(dpr * (R.x - L.x) / 62, dpr * (R.y - L.y) / 62, 0, dpr * kz, dpr * L.x, dpr * (L.y - ALTO * kz));
      var g = ctx.createLinearGradient(0, ALTO - 26, 0, ALTO); g.addColorStop(0, "rgba(40,25,10,0)"); g.addColorStop(1, "rgba(40,25,10,.18)"); ctx.fillStyle = g; ctx.fillRect(0, ALTO - Math.min(h, 26), 62, Math.min(h, 26)); ctx.restore();
      if (modo === "costruisci" && fzSotto && fzSotto.k === x.k) poligono(ctx, faccia, "rgba(255,224,102,.35)");
      // lo spessore sopra, e la testa del muro dove finisce
      var cima = [Lt, Rt, { x: Rt.x + off.x, y: Rt.y + off.y }, { x: Lt.x + off.x, y: Lt.y + off.y }];
      poligono(ctx, cima, x.basso ? "#e7dccb" : "#f6f0e6", "rgba(90,60,30,.35)", .8);
      if (x.fine) { var E = x.vt === "a" ? L : R, Et = x.vt === "a" ? Lt : Rt; poligono(ctx, [E, { x: E.x + off.x, y: E.y + off.y }, { x: Et.x + off.x, y: Et.y + off.y }, Et], x.vt === "a" ? "#ece2d2" : "#d9cdb9", "rgba(90,60,30,.35)", .8); }
      ctx.strokeStyle = "rgba(90,60,30,.4)"; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(R.x, R.y); ctx.stroke();
      facce.push({ k: x.k, sv: x.sv, poly: faccia });
    }
    function rgb(hex) { var n = parseInt((hex || "#c4523a").slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    function disegnaTetto(casa) {   // il tetto a padiglione: per ogni mattonella due triangoli, più chiari quelli che guardano la luce
      var kz = TW / 100, base = rgb((voceKit("tetti", D.tetto) || primoKit("tetti") || {}).c), W1 = D.w + 1, Lx = -.5, Ly = .45, Lz = .75, ln = Math.hypot(Lx, Ly, Lz);
      function ang(c, r) { var hh = Math.min(ANGOLI[r * W1 + c], TETTO_MAX), v = rv(c, r), z = ALTO + hh * PEND, p = pv(v[0], v[1]); return { vx: v[0], vy: v[1], z: z, x: p.x, y: p.y - z * kz }; }
      var tr = [];
      casa.t.forEach(function (t) {
        var c = t[0], r = t[1], A = ang(c, r), B = ang(c + 1, r), C = ang(c + 1, r + 1), E = ang(c, r + 1);
        (Math.abs(A.z - C.z) >= Math.abs(B.z - E.z) ? [[A, B, C], [A, C, E]] : [[A, B, E], [B, C, E]]).forEach(function (q) { tr.push({ p: q, d: (q[0].vx + q[1].vx + q[2].vx + q[0].vy + q[1].vy + q[2].vy) / 3 }); });
      });
      tr.sort(function (a, b) { return a.d - b.d; });
      tr.forEach(function (t) {
        var a = t.p[0], b = t.p[1], c = t.p[2], ux = b.vx - a.vx, uy = b.vy - a.vy, uz = (b.z - a.z) / 61, wx = c.vx - a.vx, wy = c.vy - a.vy, wz = (c.z - a.z) / 61;
        var nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        var lu = (nx * Lx + ny * Ly + nz * Lz) / (Math.hypot(nx, ny, nz) * ln), k = .62 + .45 * lu;
        var col = "rgb(" + base.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * k))); }).join(",") + ")";
        poligono(ctx, t.p, col, col, .8);
        // le file di tegole: linee alla stessa altezza (vengono parallele alla gronda)
        ctx.strokeStyle = "rgba(60,20,10,.22)"; ctx.lineWidth = Math.max(.8, TW * .012);
        for (var z = ALTO + 13; z < ALTO + TETTO_MAX * PEND; z += 19) {
          var pts = [];
          [[a, b], [b, c], [c, a]].forEach(function (e) { var P = e[0], Q = e[1]; if ((P.z - z) * (Q.z - z) < 0) { var u = (z - P.z) / (Q.z - P.z); pts.push({ x: P.x + (Q.x - P.x) * u, y: P.y + (Q.y - P.y) * u }); } });
          if (pts.length === 2) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke(); }
        }
      });
      // la gronda tutt'intorno
      ctx.strokeStyle = "rgba(70,30,15,.75)"; ctx.lineWidth = Math.max(1.5, TW * .03); ctx.lineCap = "round";
      casa.t.forEach(function (t) {
        var c = t[0], r = t[1];
        [[c, r, c + 1, r, c, r - 1], [c + 1, r, c + 1, r + 1, c + 1, r], [c, r + 1, c + 1, r + 1, c, r + 1], [c, r, c, r + 1, c - 1, r]].forEach(function (e) {
          if (dentro(e[4], e[5])) return; var A = ang(e[0], e[1]), B = ang(e[2], e[3]); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); });
      });
      ctx.lineCap = "butt";
    }
    function disegnaOgg(x) {
      var o = x.o, f = fpMondo(o), dv = ((o.d || 0) + VR) % 4, dietro = dv === 1 || dv === 2, specchio = dv === 1 || dv === 3;
      var ce = pw(o.c + f[0] / 2, o.r + f[1] / 2), k = TW / 100;
      var a = arteOgg(nomeArte(o), dietro, FASE === "notte" && o.t === "lampione", o.col);
      if (x.fantasma) ctx.globalAlpha = x.ok ? .65 : .3;
      if (modo === "sistema" && scelto === o) poligono(ctx, [pw(o.c, o.r), pw(o.c + f[0], o.r), pw(o.c + f[0], o.r + f[1]), pw(o.c, o.r + f[1])], "rgba(255,224,102,.45)");
      if (a && pronta(a.im)) {
        var w = a.info.w * k, h = a.info.h * k, ax = a.info.ax * k, ay = a.info.ay * k;
        ctx.save(); ctx.translate(ce.x, ce.y); if (specchio) ctx.scale(-1, 1); ctx.drawImage(a.im, -ax, -ay, w, h); ctx.restore();
        x.ret = { x: ce.x - (specchio ? w - ax : ax), y: ce.y - ay, w: w, h: h };
      } else x.ret = segnaposto(o, ce, f);
      if (x.fantasma) { ctx.globalAlpha = 1; if (!x.ok) poligono(ctx, [pw(o.c, o.r), pw(o.c + f[0], o.r), pw(o.c + f[0], o.r + f[1]), pw(o.c, o.r + f[1])], "rgba(224,49,49,.35)"); }
      if (modo === "vivi" && !x.fantasma && !posa) bollina(o, ce, x.ret);
    }
    function segnaposto(o, ce, f) {   // se l'arte non c'è ancora: forme semplici
      var k = TW / 100;
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(ce.x, ce.y, 34 * k * f[0], 14 * k * f[1], 0, 0, 6.29); ctx.fill();
      if (ALBERI[o.t]) { var st = stadio(o), h = [30, 70, 110, 110][st] * k; ctx.fillStyle = "#7a4a22"; ctx.fillRect(ce.x - 4 * k, ce.y - h * .5, 8 * k, h * .5); ctx.fillStyle = "#3d7b2e"; ctx.beginPath(); ctx.arc(ce.x, ce.y - h * .7, h * .38, 0, 6.29); ctx.fill(); return { x: ce.x - h * .4, y: ce.y - h * 1.1, w: h * .8, h: h * 1.1 }; }
      poligono(ctx, [pw(o.c + .1, o.r + .1), pw(o.c + f[0] - .1, o.r + .1), pw(o.c + f[0] - .1, o.r + f[1] - .1), pw(o.c + .1, o.r + f[1] - .1)], o.t === "orto" ? "#7a5230" : "#9aa5b1");
      return { x: ce.x - 40 * k, y: ce.y - 50 * k, w: 80 * k, h: 70 * k };
    }
    function bollina(o, ce, R) {   // sopra le piante: la goccia se hanno sete, i frutti se sono pronti
      var tipo = maturo(o) ? "pronto" : sete(o) ? "sete" : null; if (!tipo) return;
      var y = (R ? R.y : ce.y - TW) - TW * .12 + Math.sin(tAnim * 3 + o.k) * TW * .04, x = ce.x, rr = TW * .2, bianco = tipo === "pronto" ? "#fff8e1" : "#e7f5ff";
      ctx.fillStyle = bianco; ctx.strokeStyle = tipo === "pronto" ? "#f59f00" : "#1c7ed6"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - rr * .3, y + rr * .9); ctx.lineTo(x, y + rr * 1.35); ctx.lineTo(x + rr * .3, y + rr * .9); ctx.fillStyle = bianco; ctx.fill();
      ctx.font = Math.round(rr * 1.15) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(tipo === "pronto" ? FRUTTI[ALBERI[o.t] ? ALBERI[o.t].frutto : o.pianta][2] : "💧", x, y + 1); ctx.textBaseline = "alphabetic";
    }
    function striscia(y0, y1, col) {   // una fascia lungo il davanti del terreno (marciapiede, strada), lunga fino a fuori dallo schermo
      poligono(ctx, [pw(-60, y0), pw(D.w + 60, y0), pw(D.w + 60, y1), pw(-60, y1)], col);
    }
    function stradaFuori() {
      var H = D.h;
      striscia(H + .08, H + .85, "#ddd7c8"); striscia(H + .85, H + .97, "#b3ab98");
      striscia(H + .97, H + 2.97, "#6d727a");
      striscia(H + 2.97, H + 3.09, "#b3ab98"); striscia(H + 3.09, H + 3.85, "#ddd7c8");
      ctx.strokeStyle = "rgba(120,110,95,.35)"; ctx.lineWidth = 1;
      for (var c = -30; c < D.w + 30; c += 1) { var a = pw(c, H + .08), b = pw(c, H + .85); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      var p0 = pw(-60, H + 1.97), p1 = pw(D.w + 60, H + 1.97);
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = Math.max(1.5, TW * .035); ctx.setLineDash([TW * .4, TW * .35]);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); ctx.setLineDash([]);
    }
    var VICINI = null;
    function vicini() {   // alberi e cespugli dei giardini accanto (si vedono quelli dietro al recinto)
      if (!VICINI) {
        var r = rnd(911), l = [], i, specie = ["albero_melo_2", "cespuglio", "albero_ciliegio_2", "albero_limone_2", "cespuglio", "albero_arancio_2"], W = D.w, H = D.h;
        function n() { return specie[Math.floor(r() * specie.length)]; }
        for (i = -1; i < H - 1.2; i += 1.3 + r() * .9) { l.push({ x: -1.4 - r() * .8, y: i, n: n() }); l.push({ x: W + 1.4 + r() * .8, y: i, n: n() }); }
        for (i = .2; i < W; i += 1.3 + r() * .9) l.push({ x: i, y: -1.4 - r() * .8, n: n() });
        VICINI = l;
      }
      var k = TW / 100;
      VICINI.map(function (v) { var q = rv(v.x, v.y); return { v: v, q: q }; }).filter(function (z) { return z.q[0] < 0 || z.q[1] < 0; })
        .sort(function (a, b) { return a.q[0] + a.q[1] - b.q[0] - b.q[1]; })
        .forEach(function (z) { var a = arteOgg(z.v.n), ce = pv(z.q[0], z.q[1]); if (a && pronta(a.im)) ctx.drawImage(a.im, ce.x - a.info.ax * k, ce.y - a.info.ay * k, a.info.w * k, a.info.h * k); });
    }
    function recinto(dietro) {   // la staccionata tutto intorno al terreno (davanti al vialetto il cancello è aperto)
      var A = arteOgg("staccionata_a"), B = arteOgg("staccionata_b"), k = TW / 100, l = [], W = D.w, H = D.h, i;
      function bordo(x0, y0, x1, y1) {   // un pezzo del bordo nel mondo → il pezzo di staccionata visto da qui
        var p = rv(x0, y0), q = rv(x1, y1), vt = p[0] === q[0] ? "a" : "b", vx = Math.min(p[0], q[0]), vy = Math.min(p[1], q[1]);
        var su = vt === "a" ? vx === 0 : vy === 0; if (su !== dietro) return;
        l.push({ vt: vt, vx: vx, vy: vy });
      }
      for (i = 0; i < H; i++) { bordo(0, i, 0, i + 1); bordo(W, i, W, i + 1); }
      for (i = 0; i < W; i++) { bordo(i, 0, i + 1, 0); if (CANCELLO.indexOf(i) < 0) bordo(i, H, i + 1, H); }
      l.sort(function (a, b) { return a.vx + a.vy - b.vx - b.vy; });
      l.forEach(function (p) {
        var a = p.vt === "a" ? A : B, ce = pv(p.vx + .5, p.vy + .5);
        if (a && pronta(a.im)) return ctx.drawImage(a.im, ce.x - a.info.ax * k, ce.y - a.info.ay * k, a.info.w * k, a.info.h * k);
        var s0 = p.vt === "a" ? pv(p.vx, p.vy + 1) : pv(p.vx, p.vy), s1 = p.vt === "a" ? pv(p.vx, p.vy) : pv(p.vx + 1, p.vy);
        ctx.strokeStyle = "#f4ead2"; ctx.lineWidth = Math.max(2, TW * .04);
        [.12, .26].forEach(function (h) { ctx.beginPath(); ctx.moveTo(s0.x, s0.y - TW * h); ctx.lineTo(s1.x, s1.y - TW * h); ctx.stroke(); });
      });
    }
    var fzSotto = null;   // il muro sotto al dito mentre costruisci (si illumina)
    function disegna() {
      var P = pal(), dV = vistaDentro(), i;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = P.fuori; ctx.fillRect(0, 0, cw, ch);
      stradaFuori();
      if (!sfondo) sfondo = disegnaSfondo();
      ctx.drawImage(sfondo.c, ox - sfondo.o0.x, oy - sfondo.o0.y, sfondo.L, sfondo.A);
      if (modo === "costruisci") {   // la griglia per costruire
        ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.2;
        for (i = 0; i <= VW(); i++) { var a = pv(i, 0), b = pv(i, VH()); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        for (i = 0; i <= VH(); i++) { var c2 = pv(0, i), d2 = pv(VW(), i); ctx.beginPath(); ctx.moveTo(c2.x, c2.y); ctx.lineTo(d2.x, d2.y); ctx.stroke(); }
      }
      vicini(); recinto(true);
      // le cose in piedi, i muri, l'avatar e i tetti: dal più lontano al più vicino
      var lista = pezziMuro(dV), appesi = {};
      D.ogg.forEach(function (o) {
        if (appeso(o)) { if (!(fantasma && fantasma.muroDi === o)) appesi[o.muro + "|" + o.lato] = o; return; }
        if (tipoDi(o.t) !== "piedi" || (fantasma && fantasma.o === o)) return;
        var b = box(o); if (!dV && dentro(b.c0, b.r0)) return;   // da fuori i mobili non si vedono (c'è il tetto)
        lista.push({ b: boxV(b), o: o });
      });
      if (fantasma && fantasma.muroDi) appesi[fantasma.fz.k + "|" + fantasma.fz.sv] = fantasma.muroDi;
      if (fantasma && !fantasma.muroDi && tipoDi(fantasma.t) === "piedi") { var fo = { t: fantasma.t, c: fantasma.c, r: fantasma.r, d: fantasma.d, k: 0, col: fantasma.col }; lista.push({ b: boxV(box(fo)), o: fo, fantasma: true, ok: libero(fo.t, fo.c, fo.r, fo.d, fantasma.salta) }); }
      var pa = rv(av.u, av.v); lista.push({ b: { c0: pa[0], c1: pa[0], r0: pa[1], r1: pa[1] }, avatar: true });
      if (!dV) CASE.forEach(function (cs) { lista.push({ b: boxV(cs.b), tetto: true, casa: cs }); });
      ordinati = ordina(lista); facce = [];
      ordinati.forEach(function (x) {
        if (x.avatar) return disegnaAvatar();
        if (x.muro) return disegnaMuro(x, appesi);
        if (x.tetto) return disegnaTetto(x.casa);
        disegnaOgg(x);
      });
      recinto(false);
      if (tracciato) {   // il muro che stai tracciando: trasparente, col prezzo
        var pz = pezziTracciato(tracciato), kz = TW / 100;
        pz.forEach(function (p) { var A2 = p[0] === "a" ? pw(p[1], p[2] + 1) : pw(p[1], p[2]), B2 = p[0] === "a" ? pw(p[1], p[2]) : pw(p[1] + 1, p[2]); poligono(ctx, [A2, B2, { x: B2.x, y: B2.y - ALTO * kz }, { x: A2.x, y: A2.y - ALTO * kz }], "rgba(255,248,230,.55)", "rgba(63,122,46,.9)", 1.5); });
        var fine = pw(tracciato.b[0], tracciato.b[1]), ok = monete() >= pz.length * COSTO.muro;
        ctx.font = "900 " + Math.round(Math.max(13, TW * .24)) + "px sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.fillStyle = ok ? "#fff" : "#ff8787";
        var tx = pz.length ? "🪙 " + cifre(pz.length * COSTO.muro) : "🚫"; ctx.strokeText(tx, fine.x, fine.y - TW * .3); ctx.fillText(tx, fine.x, fine.y - TW * .3);
        ctx.fillStyle = "#ffe066"; ctx.beginPath(); ctx.arc(pw(tracciato.a[0], tracciato.a[1]).x, pw(tracciato.a[0], tracciato.a[1]).y, Math.max(4, TW * .07), 0, 6.29); ctx.fill();
      }
      // i frutti che volano nel cesto
      volano.forEach(function (p) { ctx.globalAlpha = Math.max(0, 1 - p.t / 1.1); ctx.font = Math.round(TW * .3) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.e, p.x, p.y); });
      ctx.globalAlpha = 1;
      // la sera e la notte: tutto un po' più scuro, poi le luci calde (lampioni e porte di casa)
      if (P.buio) {
        ctx.fillStyle = "rgba(" + P.velo + "," + P.buio + ")"; ctx.fillRect(0, 0, cw, ch);
        if (FASE === "notte") {
          ctx.globalCompositeOperation = "lighter";
          var luci = D.ogg.filter(function (o) { return o.t === "lampione"; }).map(function (o) { var p = pw(o.c + .5, o.r + .5); return { x: p.x, y: p.y - TW * 1.5, r: TW * 1.7 }; });
          Object.keys(D.muri).forEach(function (k) { var m = D.muri[k]; if (!porta(m)) return; var ll = lati(k), d0 = dentro(ll[0][0], ll[0][1]), d1 = dentro(ll[1][0], ll[1][1]); if (d0 === d1) return; var t = d0 ? ll[1] : ll[0], q = k.split(","), mx = q[0] === "a" ? +q[1] : +q[1] + .5, my = q[0] === "a" ? +q[2] + .5 : +q[2]; var p = pw(mx + (t[0] + .5 - mx) * .5, my + (t[1] + .5 - my) * .5); luci.push({ x: p.x, y: p.y - TW * .6, r: TW * 1.3 }); });
          luci.forEach(function (l) { var gg = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r); gg.addColorStop(0, "rgba(255,190,90,.38)"); gg.addColorStop(1, "rgba(255,190,90,0)"); ctx.fillStyle = gg; ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); });
          ctx.globalCompositeOperation = "source-over";
        }
      }
    }
    function disegnaAvatar() {
      if (!IM) return;
      var p = pw(av.u, av.v), h = TW * 1.3, w = h / 1.3, cammina = av.strada.length > 0, fv = vecV(av.fw[0], av.fw[1]);
      var dietro = fv[0] + fv[1] < -1e-3, specchio = fv[0] - fv[1] < -1e-3, set = dietro ? IM.dietro : IM.davanti;
      var im = cammina && Math.floor(av.t * 6) % 2 ? set[1] : set[0];
      if (!pronta(im)) return;
      var alza = cammina ? Math.abs(Math.sin(av.t * 18)) * h * .02 : 0, piega2 = 0, al = 1;
      if (av.fa === "esce") al = Math.min(1, av.ft / .45);
      if (av.fa === "raccogli") piega2 = Math.sin(Math.min(1, av.ft / .5) * Math.PI) * .05;
      if (av.fa === "dondola") alza += Math.abs(Math.sin(av.ft * 5)) * h * .08;
      ctx.globalAlpha = al;
      ctx.fillStyle = "rgba(30,40,10,.28)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, w * .3, w * .1, 0, 0, 6.29); ctx.fill();
      ctx.save(); ctx.translate(p.x, p.y - alza + piega2 * h); if (specchio) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h * .96, w, h); ctx.restore();
      if (av.fa === "acqua" && av.su) {   // l'annaffiatoio verde e le gocce
        var dir = specchio ? -1 : 1, mx = p.x + dir * w * .3, my = p.y - h * .42;
        ctx.save(); ctx.translate(mx, my); ctx.rotate(dir * (.5 + Math.sin(av.ft * 8) * .08)); ctx.scale(dir, 1);
        ctx.fillStyle = "#2f9e44"; ctx.strokeStyle = "#1b5e2a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.rect(-w * .12, -w * .1, w * .24, w * .18); ctx.fill(); ctx.stroke();
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
        av.t += dt; if (d > 1e-3) av.fw = [du, dv];
        if (d <= passo) { av.u = t.u; av.v = t.v; av.strada.shift(); if (!av.strada.length && av.poi) { var f = av.poi; av.poi = null; f(); } }
        else { av.u += du / d * passo; av.v += dv / d * passo; }
        mosso = true;
      }
      if (av.fa) { av.ft += dt; mosso = true; if (av.ft > (av.fa === "acqua" ? 1.1 : av.fa === "dondola" ? 2.4 : .8)) { av.fa = null; av.su = null; } }
      volano.forEach(function (p) { p.t += dt; p.x += p.vx; p.y += p.vy; p.vy += .25; }); volano = volano.filter(function (p) { return p.t < 1.1; });
      if (volano.length) mosso = true;
      if (giroAnim) { giroAnim.t += dt; mosso = true; if (giroAnim.t > .26) giroAnim = null; }
      if (mosso) sporco = true;
    }
    var anim = 0, ult = 0, tBolle = 0, tela2 = null;
    function giro(o) {
      if (!vivo()) return chiudi();
      var dt = Math.min(.05, (o - ult) / 1000 || 0); ult = o;
      aggiorna(dt); tBolle += dt;
      if (tBolle > .08) { tBolle = 0; if (modo === "vivi" && D.ogg.some(function (x) { return maturo(x) || sete(x); })) sporco = true; }
      if (sporco) {
        sporco = false; disegna();
        if (giroAnim) {   // la vista che gira: la foto di prima si stringe, quella nuova si allarga
          var t = giroAnim.t / .26, sx = t < .5 ? Math.cos(t * Math.PI) : Math.sin((t - .5) * Math.PI), src = cv;
          if (t >= .5) { if (!tela2 || tela2.width !== cv.width || tela2.height !== cv.height) { tela2 = document.createElement("canvas"); tela2.width = cv.width; tela2.height = cv.height; } tela2.getContext("2d").drawImage(cv, 0, 0); src = tela2; } else src = giroAnim.foto;
          ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = pal().fuori; ctx.fillRect(0, 0, cv.width, cv.height);
          var w2 = cv.width * Math.max(.02, sx); ctx.drawImage(src, (cv.width - w2) / 2, 0, w2, cv.height);
        }
      }
      anim = requestAnimationFrame(giro);
    }
    var tCresci = setInterval(function () { if (!vivo()) return; cresciTutto(); sporco = true; }, 30000);
    var tFase = setInterval(function () { var f = fase(); if (f !== FASE) { FASE = f; sfondo = null; sporco = true; } }, 60000);

    function chiudi() { cancelAnimationFrame(anim); clearInterval(tCresci); clearInterval(tFase); window.removeEventListener("resize", misura); quandoPronta = null; }
    function esci() { chiudi(); clearTimeout(tSalva); if (opts.salva) opts.salva(D); if (opts.indietro) opts.indietro(); }
    s._monta = function () {
      quandoPronta = function () { if (vivo()) { sfondo = null; sporco = true; } };   // un disegno è arrivato: si ridisegna
      calcolaStanze(); cresciTutto(); misura(); aggTesta();
      if (!D.visto) { D.visto = 1; salva(); dimmi("Benvenuto a casa! Tocca il germoglio per annaffiarlo 💧"); }
      else { var pronti = D.ogg.filter(maturo).length, assetati = D.ogg.filter(sete).length;
        if (pronti) dimmi("Ci sono " + pronti + (pronti === 1 ? " pianta pronta" : " piante pronte") + " da raccogliere! 🧺");
        else if (assetati) dimmi("💧 " + assetati + (assetati === 1 ? " pianta ha" : " piante hanno") + " sete"); }
      anim = requestAnimationFrame(function (o) { ult = o; giro(o); });
    };
    s._chiudi = chiudi;
    window.__giardino = { D: D, av: av, disegna: function () { disegna(); }, fase: function (f) { FASE = f; sfondo = null; sporco = true; }, pw: pw, tap: function (x, y) { tocca(x, y); },
      gira: gira, modo: cambiaModo, attrezzo: function (a, id) { attrezzo = a; if (id) sceltaKit[GRUPPO[a]] = id; pannelloCostruisci(); }, muri: function (a, b) { costruisciMuri({ a: a, b: b }); },
      faccia: function (k, sv) { for (var i = 0; i < facce.length; i++) if (facce[i].k === k && (sv == null || facce[i].sv === sv)) return facce[i]; return null; },
      dentro: dentro, stanza: stanza, vai: function (c, r) { vaiA([{ c: c, r: r }]); }, tocca: function (o) { vaiAOggetto(o); }, avanza: function (sec) { for (var i = 0; i < sec * 60; i++) aggiorna(1 / 60); sporco = true; },
      cresciTutto: cresciTutto, foto: function () { disegna(); return cv.toDataURL("image/png"); } };   // (per le prove)
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
      ".gd-bott{height:46px;padding:0 4px;border:0;border-radius:14px;cursor:pointer;font:inherit;font-weight:900;font-size:.78rem;color:#fff;background:rgba(30,60,20,.62);box-shadow:inset 0 0 0 1.5px rgba(220,255,200,.3)}",
      ".gd-sistema .gd-bott:not(:nth-child(3)),.gd-costr .gd-bott:not(:nth-child(2)){opacity:.45}",
      ".gd-sis{position:absolute;left:10px;right:10px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:3;display:none;align-items:center;gap:6px;padding:6px 6px 6px 12px;border-radius:14px;background:rgba(255,250,235,.95);box-shadow:0 4px 12px rgba(0,0,0,.25)}",
      ".gd-sis.su{display:flex}",
      ".gd-sis-t{flex:1;min-width:0;font-weight:800;font-size:.82rem;color:#2b4a1f}",
      ".gd-sis-b{flex:none;height:36px;min-width:40px;padding:0 10px;border:0;border-radius:10px;cursor:pointer;font:inherit;font-weight:900;font-size:.85rem;color:#fff;background:#3f7a2e}",
      ".gd-attrezzi{position:absolute;left:8px;right:8px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:3;display:none;flex-direction:column;gap:6px;padding:7px;border-radius:16px;background:rgba(255,250,235,.96);box-shadow:0 4px 14px rgba(0,0,0,.28)}",
      ".gd-attrezzi.su{display:flex}",
      ".gd-strum,.gd-scelte{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}",
      ".gd-strum::-webkit-scrollbar,.gd-scelte::-webkit-scrollbar{display:none}",
      ".gd-str{flex:none;height:36px;padding:0 10px;border:0;border-radius:11px;cursor:pointer;font:inherit;font-weight:900;font-size:.78rem;color:#2b4a1f;background:#eef5e4}",
      ".gd-str.on{color:#fff;background:#3f7a2e}",
      ".gd-sc{flex:none;width:62px;display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 2px;border:0;border-radius:11px;cursor:pointer;font:inherit;color:#2b4a1f;background:#f3f7ec}",
      ".gd-sc img{width:48px;height:48px;border-radius:8px;object-fit:cover;object-position:50% 70%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2)}",
      ".gd-sc img.gd-sc-alto{object-fit:contain;object-position:50% 50%;background:#e9e2d4}",
      ".gd-sc span{font-size:.6rem;font-weight:800;line-height:1.1;max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gd-sc small{font-size:.58rem;font-weight:800;color:#5f7a45}",
      ".gd-sc.on{box-shadow:inset 0 0 0 3px #3f7a2e;background:#e2f0d4}",
      ".gd-sc-tutta{width:auto;padding:0 10px;justify-content:center;font-weight:900;font-size:.72rem}",
      ".gd-sc-t{margin:2px 4px;font-size:.78rem;font-weight:800;line-height:1.3;color:#2b4a1f}",
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
