/* =========================================================
   SPeeD GAME — LA PESCA (il laghetto della città)
   Vista di lato: in alto il cielo e il tuo avatar sul pontile, sotto l'acqua coi pesci (si vedono le ombre).
   Una pescata:
   1. tieni premuto per caricare il lancio (la forza va su e giù) e lasci: più lontano = più fondo, pesci più rari;
   2. aspetti: un pesce si avvicina e assaggia (il galleggiante trema) e poi abbocca (va giù): tocca subito!
      Se tocchi prima, ritiri la lenza e il pesce scappa;
   3. la lotta: tieni premuto per tirare, molla quando il filo è troppo teso o il pesce dà uno strattone (❗);
   4. la carta del pesce: misura, rarità, record; lo vendi o lo tieni nel cesto.
   10 esche al giorno (un'esca si usa quando un pesce abbocca), altre si comprano. Pesci diversi di giorno,
   al tramonto e di notte (l'ora vera della città). Album dei pesci e delle curiosità (scarpone, forziere…).
   SGPesca.crea({ omino, dati, salva(dati), monete(), cambia(n), audio(), indietro }) -> schermata (poi ._monta())
   ========================================================= */
(function () {
  "use strict";

  // ---------- il mondo (in unità: 100 di larghezza, 180 di altezza) ----------
  var W = 100, H = 180, SUP = 60, PONTE = 22, ESCHE_GIORNO = 10, PACCO = { n: 5, prezzo: 400 }, CESTO_MAX = 30;
  function yFondo(x) { return Math.min(166, x < 18 ? 79 : 79 + (x - 18) * 1.0); }   // il fondo del lago: basso vicino al pontile, profondo al largo
  function fracDi(x) { return Math.max(0, Math.min(1, (x - 26) / 68)); }            // 0 = vicino al pontile, 1 = al largo

  // ---------- i pesci: dove stanno (dove: da 0 vicino al pontile a 1 al largo), quando, quanto sono grandi, quanto lottano ----------
  // r: 1 comune, 2 raro, 3 epico, 4 leggendario · col: dorso, pancia, pinne
  var PESCI = [
    { id: "alborella", nome: "Alborella", r: 1, cm: [8, 15], dove: [0, .5], quando: "sempre", forza: .6, prezzo: 20, col: ["#9fb3c0", "#f1f5f8", "#c5d6e0"], forma: "snello" },
    { id: "pescesole", nome: "Persico sole", r: 1, cm: [8, 18], dove: [0, .45], quando: "giorno", forza: .7, prezzo: 30, col: ["#d9822b", "#ffd8a8", "#1c7ed6"], forma: "alto", disegno: "macchie" },
    { id: "scardola", nome: "Scardola", r: 1, cm: [15, 30], dove: [0, .55], quando: "giorno", forza: .8, prezzo: 35, col: ["#8a9a6a", "#eef0d8", "#e8590c"], forma: "normale" },
    { id: "cavedano", nome: "Cavedano", r: 1, cm: [15, 40], dove: [.2, .75], quando: "sempre", forza: 1, prezzo: 40, col: ["#6c7a80", "#e9ecef", "#adb5bd"], forma: "normale", disegno: "squame" },
    { id: "carassio", nome: "Carassio", r: 1, cm: [10, 30], dove: [.2, .75], quando: "sempre", forza: .9, prezzo: 45, col: ["#b8901c", "#f6e7a6", "#a07d12"], forma: "alto" },
    { id: "tinca", nome: "Tinca", r: 1, cm: [20, 50], dove: [.5, 1], quando: "sempre", forza: 1.2, prezzo: 60, col: ["#4f6b2f", "#c5d48a", "#3b5023"], forma: "normale" },
    { id: "persico", nome: "Persico reale", r: 2, cm: [20, 45], dove: [.3, .85], quando: "giorno", forza: 1.3, prezzo: 150, col: ["#7f9a32", "#f0f2d0", "#e03131"], forma: "alto", disegno: "strisce" },
    { id: "trota", nome: "Trota fario", r: 2, cm: [25, 55], dove: [.2, .75], quando: "giorno", forza: 1.5, prezzo: 180, col: ["#8a6a3f", "#f3e3c3", "#6b5232"], forma: "normale", disegno: "puntini" },
    { id: "gambero", nome: "Gambero di fiume", r: 2, cm: [6, 12], dove: [0, .6], quando: "notte", forza: .8, prezzo: 120, col: ["#a8432b", "#e07a5f", "#7a2c19"], forma: "gambero" },
    { id: "carpa", nome: "Carpa", r: 2, cm: [30, 80], dove: [.6, 1], quando: "sempre", forza: 1.9, prezzo: 220, col: ["#94692a", "#e8cf8f", "#7a5620"], forma: "alto", disegno: "squame" },
    { id: "anguilla", nome: "Anguilla", r: 2, cm: [40, 90], dove: [.6, 1], quando: "notte", forza: 1.7, prezzo: 240, col: ["#3d4a2a", "#a3a77a", "#2b3420"], forma: "anguilla" },
    { id: "luccio", nome: "Luccio", r: 2, cm: [50, 110], dove: [.4, .95], quando: "sempre", forza: 2.2, prezzo: 350, col: ["#56743a", "#e3e8c8", "#3f5527"], forma: "lungo", disegno: "puntini" },
    { id: "koi", nome: "Carpa koi", r: 3, cm: [30, 70], dove: [.3, .85], quando: "tramonto", forza: 1.9, prezzo: 700, col: ["#fff4e6", "#ffffff", "#f03e3e"], forma: "alto", disegno: "koi" },
    { id: "iridea", nome: "Trota iridea", r: 3, cm: [30, 60], dove: [.3, .85], quando: "giorno", forza: 2.1, prezzo: 800, col: ["#7d9fb8", "#f8f0fc", "#e64980"], forma: "normale", disegno: "arcobaleno" },
    { id: "pescegatto", nome: "Pesce gatto", r: 3, cm: [40, 90], dove: [.6, 1], quando: "notte", forza: 2.2, prezzo: 650, col: ["#495057", "#ced4da", "#343a40"], forma: "baffi" },
    { id: "storione", nome: "Storione", r: 3, cm: [80, 160], dove: [.75, 1], quando: "sempre", forza: 2.6, prezzo: 950, col: ["#6c757d", "#dee2e6", "#495057"], forma: "storione" },
    { id: "siluro", nome: "Siluro gigante", r: 4, cm: [150, 250], dove: [.8, 1], quando: "notte", forza: 3.2, prezzo: 3000, col: ["#2b3035", "#adb5bd", "#212529"], forma: "baffi" },
    { id: "re", nome: "Il Re del lago", r: 4, cm: [120, 160], dove: [.6, 1], quando: "giorno", forza: 3.4, prezzo: 4000, col: ["#2b8a3e", "#ffe066", "#1b5e2a"], forma: "lungo", disegno: "corona" },
    { id: "oro", nome: "Carpa d'oro", r: 4, cm: [40, 80], dove: [.4, .9], quando: "tramonto", forza: 3, prezzo: 5000, col: ["#f2b705", "#fff3bf", "#e67700"], forma: "alto", disegno: "squame" }
  ];
  var CURIOSITA = [
    { id: "scarpone", nome: "Scarpone vecchio", ico: "👢", prezzo: 1, frase: "Qualcuno ha perso una scarpa…", peso: 3 },
    { id: "lattina", nome: "Lattina", ico: "🥫", prezzo: 5, frase: "Hai pulito il laghetto: bravo!", peso: 3 },
    { id: "bottiglia", nome: "Bottiglia col messaggio", ico: "🍾", prezzo: 100, peso: 2 },
    { id: "forziere", nome: "Forziere", ico: "💰", prezzo: 0, frase: "Un piccolo tesoro!", peso: 1 }
  ];
  var MESSAGGI = [   // nelle bottiglie: qualche dritta per i pesci rari
    "«Di notte, al largo, nuota qualcosa di enorme… coi baffi.»",
    "«Quando il sole è alto, il Re del lago esce dal fondo.»",
    "«Al tramonto l'acqua diventa d'oro: occhio alla carpa!»",
    "«Le carpe koi si fanno vedere solo al tramonto.»",
    "«I gamberi escono di notte, vicino al pontile.»",
    "«Chi pesca lontano trova i pesci più grossi.»",
    "«Se il pesce dà uno strattone, molla un attimo il filo!»",
    "«Ciao a chi mi trova! Firmato: un pescatore annoiato.»"
  ];
  var RARITA = { 1: ["Comune", "#868e96"], 2: ["Raro", "#1c7ed6"], 3: ["Epico", "#9c36b5"], 4: ["Leggendario", "#f08c00"] };
  var PESO_R = { 1: 60, 2: 24, 3: 9, 4: 2.6 };
  function pesce(id) { for (var i = 0; i < PESCI.length; i++) if (PESCI[i].id === id) return PESCI[i]; return null; }
  function curiosita(id) { for (var i = 0; i < CURIOSITA.length; i++) if (CURIOSITA[i].id === id) return CURIOSITA[i]; return null; }
  function adesso(sp, fase) { return sp.quando === "sempre" || sp.quando === fase || (fase === "tramonto" && sp.quando !== "tramonto" ? Math.random() < .5 : false); }   // al tramonto escono un po' quelli del giorno e un po' quelli della notte
  function valore(sp, cm) { var k = (cm - sp.cm[0]) / Math.max(1, sp.cm[1] - sp.cm[0]); return Math.round(sp.prezzo * (0.7 + 0.6 * k)); }   // i più grossi valgono di più
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function oggi() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function fase() { try { return window.SGCitta ? SGCitta.fase(new Date()) : "giorno"; } catch (e) { return "giorno"; } }
  function datiIniziali() { return { v: 1, album: {}, cesto: [], esche: { g: oggi(), usate: 0 }, extra: 0, tot: 0 }; }

  // ---------- il disegno di un pesce (per la carta, l'album e il salto fuori dall'acqua) ----------
  // ctx già spostato: il pesce è centrato in 0,0, lungo L, guarda a destra
  function disegnaPesce(c, sp, L) {
    var h = L * ({ snello: .26, alto: .48, lungo: .2, anguilla: .11, baffi: .3, storione: .2, normale: .34 }[sp.forma] || .34), col = sp.col;
    c.save(); c.lineJoin = "round"; c.lineCap = "round";
    if (sp.forma === "gambero") return gambero(c, sp, L), c.restore();
    var x0 = -L / 2, x1 = L / 2, coda = sp.forma === "anguilla" ? L * .08 : L * .2;
    // la coda
    c.fillStyle = col[2];
    c.beginPath(); c.moveTo(x0 + coda * .6, 0); c.lineTo(x0 - coda * .5, -h * .55); c.quadraticCurveTo(x0 - coda * .1, 0, x0 - coda * .5, h * .55); c.closePath(); c.fill();
    // le pinne (sopra e sotto)
    c.beginPath(); c.moveTo(-L * .12, -h * .42); c.quadraticCurveTo(L * .02, -h * .95, L * .14, -h * .4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-L * .05, h * .4); c.quadraticCurveTo(L * .04, h * .78, L * .12, h * .38); c.closePath(); c.fill();
    // il corpo: dorso scuro e pancia chiara
    function corpo() {
      c.beginPath(); c.moveTo(x0 + coda * .5, 0);
      if (sp.forma === "anguilla") { c.bezierCurveTo(x0 + L * .3, -h * 1.2, x1 - L * .2, -h * .9, x1, 0); c.bezierCurveTo(x1 - L * .2, h * .9, x0 + L * .3, h * 1.2, x0 + coda * .5, 0); }
      else if (sp.forma === "lungo" || sp.forma === "storione") { c.bezierCurveTo(x0 + L * .25, -h * .75, x1 - L * .25, -h * .7, x1, -h * .05); c.lineTo(x1, h * .05); c.bezierCurveTo(x1 - L * .25, h * .7, x0 + L * .25, h * .75, x0 + coda * .5, 0); }
      else { c.bezierCurveTo(x0 + L * .2, -h * .62, x1 - L * .18, -h * .68, x1, 0); c.bezierCurveTo(x1 - L * .18, h * .68, x0 + L * .2, h * .62, x0 + coda * .5, 0); }
      c.closePath();
    }
    corpo();
    var g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, col[0]); g.addColorStop(.55, col[0]); g.addColorStop(1, col[1]);
    c.fillStyle = g; c.fill();
    c.save(); corpo(); c.clip();
    var i;
    if (sp.disegno === "strisce") { c.fillStyle = "rgba(20,30,10,.38)"; for (i = 0; i < 6; i++) { var sx = -L * .3 + i * L * .1; c.fillRect(sx, -h, L * .04, h * 1.3); } }
    else if (sp.disegno === "puntini") { c.fillStyle = sp.id === "trota" ? "#c92a2a" : "rgba(255,255,230,.55)"; for (i = 0; i < 14; i++) { c.beginPath(); c.arc(-L * .32 + ((i * 37) % 60) / 60 * L * .65, -h * .35 + ((i * 53) % 40) / 40 * h * .55, L * .018, 0, 7); c.fill(); } }
    else if (sp.disegno === "macchie") { c.fillStyle = "rgba(28,126,214,.45)"; for (i = 0; i < 5; i++) { c.beginPath(); c.arc(-L * .25 + i * L * .12, -h * .1 + (i % 2) * h * .12, L * .05, 0, 7); c.fill(); } }
    else if (sp.disegno === "squame") { c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = Math.max(1, L * .008); for (i = 0; i < 24; i++) { var qx = -L * .3 + (i % 8) * L * .08, qy = -h * .3 + Math.floor(i / 8) * h * .25; c.beginPath(); c.arc(qx, qy, L * .045, -1.2, 1.2); c.stroke(); } }
    else if (sp.disegno === "koi") { c.fillStyle = "#f03e3e"; [[-.2, -.2, .12], [.05, -.25, .1], [.18, .02, .07], [-.05, .05, .06]].forEach(function (m) { c.beginPath(); c.ellipse(m[0] * L, m[1] * h * 2, m[2] * L, m[2] * L * .7, 0, 0, 7); c.fill(); }); }
    else if (sp.disegno === "arcobaleno") { var ga = c.createLinearGradient(0, -h * .15, 0, h * .15); ga.addColorStop(0, "rgba(230,73,128,0)"); ga.addColorStop(.5, "rgba(230,73,128,.75)"); ga.addColorStop(1, "rgba(230,73,128,0)"); c.fillStyle = ga; c.fillRect(-L / 2, -h * .2, L, h * .4); }
    if (sp.forma === "storione") { c.fillStyle = "rgba(255,255,255,.55)"; for (i = 0; i < 7; i++) { c.beginPath(); c.arc(-L * .3 + i * L * .1, -h * .32, L * .016, 0, 7); c.fill(); } }
    c.restore();
    // la luce sul dorso, l'occhio, la bocca
    c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.ellipse(L * .02, -h * .22, L * .28, h * .08, -.05, 0, 7); c.fill();
    var ex = x1 - L * (sp.forma === "anguilla" ? .06 : .14), ey = -h * (sp.forma === "anguilla" ? .1 : .12), er = Math.max(1.5, L * (sp.forma === "anguilla" ? .022 : .035));
    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(ex, ey, er, 0, 7); c.fill(); c.fillStyle = "#111"; c.beginPath(); c.arc(ex + er * .25, ey, er * .55, 0, 7); c.fill();
    c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = Math.max(1, L * .01); c.beginPath(); c.moveTo(x1 - L * .02, h * .06); c.lineTo(x1 - L * .07, h * .1); c.stroke();
    if (sp.forma === "baffi") { c.strokeStyle = col[2]; c.lineWidth = Math.max(1, L * .012); [[-.5, .5], [.2, .9], [.6, 1.2]].forEach(function (b) { c.beginPath(); c.moveTo(x1 - L * .03, h * .08); c.quadraticCurveTo(x1 + L * .08, h * b[0], x1 + L * .02, h * b[1]); c.stroke(); }); }
    if (sp.disegno === "corona") {   // il Re del lago ha la corona!
      c.fillStyle = "#ffd43b"; c.strokeStyle = "#e67700"; c.lineWidth = Math.max(1, L * .008);
      var cx = ex - L * .02, cy = -h * .6, cw = L * .1;
      c.beginPath(); c.moveTo(cx - cw / 2, cy); c.lineTo(cx - cw / 2, cy - cw * .55); c.lineTo(cx - cw / 4, cy - cw * .25); c.lineTo(cx, cy - cw * .7); c.lineTo(cx + cw / 4, cy - cw * .25); c.lineTo(cx + cw / 2, cy - cw * .55); c.lineTo(cx + cw / 2, cy); c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  }
  function gambero(c, sp, L) {
    var col = sp.col, h = L * .22, i;
    c.fillStyle = col[0]; c.strokeStyle = col[2]; c.lineWidth = Math.max(1, L * .012);
    for (i = 0; i < 6; i++) { c.beginPath(); c.ellipse(-L * .32 + i * L * .09, 0, L * .07, h * (.55 - i * .03), 0, 0, 7); c.fill(); c.stroke(); }   // la coda a segmenti
    c.beginPath(); c.moveTo(-L * .38, 0); c.lineTo(-L * .5, -h * .5); c.lineTo(-L * .5, h * .5); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(L * .2, 0, L * .17, h * .62, 0, 0, 7); c.fill(); c.stroke();   // la testa
    [[-1], [1]].forEach(function (s) {   // le chele
      var k = s[0]; c.beginPath(); c.moveTo(L * .3, k * h * .3); c.quadraticCurveTo(L * .42, k * h * 1.1, L * .5, k * h * .7); c.stroke();
      c.beginPath(); c.ellipse(L * .5, k * h * .75, L * .07, h * .3, k * .5, 0, 7); c.fillStyle = col[1]; c.fill(); c.stroke(); c.fillStyle = col[0];
    });
    c.beginPath(); c.moveTo(L * .35, -h * .2); c.quadraticCurveTo(L * .6, -h * 1.5, L * .7, -h * 1.8); c.moveTo(L * .35, -h * .1); c.quadraticCurveTo(L * .65, -h * .9, L * .8, -h * 1.2); c.stroke();   // le antenne
    c.fillStyle = "#111"; c.beginPath(); c.arc(L * .3, -h * .25, Math.max(1.5, L * .025), 0, 7); c.fill();
  }
  function immaginePesce(sp, L, alto) {   // una tela col pesce disegnato (per le carte e l'album)
    var dpr = Math.min(2, window.devicePixelRatio || 1), c = document.createElement("canvas"); c.width = Math.round(L * 1.25 * dpr); c.height = Math.round((alto || L * .7) * dpr);
    c.style.width = L * 1.25 + "px"; c.style.height = (alto || L * .7) + "px";
    var x = c.getContext("2d"); x.scale(dpr, dpr); x.translate(L * .62, (alto || L * .7) / 2); disegnaPesce(x, sp, L);
    return c;
  }

  // ---------- suoni (fatti al volo) ----------
  var AUDIO = null;
  function tono(f, quando, dur, tipo, vol, fine) {
    var c = AUDIO && AUDIO(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), a = c.currentTime + (quando || 0);
      o.type = tipo || "sine"; o.frequency.setValueAtTime(f, a); if (fine) o.frequency.exponentialRampToValueAtTime(fine, a + dur);
      g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(vol || 0.1, a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + dur);
      o.connect(g); g.connect(c.destination); o.start(a); o.stop(a + dur + 0.05);
    } catch (e) {}
  }
  function suonoLancio() { tono(500, 0, .25, "sine", .05, 1400); }
  function suonoSplash() { tono(900, 0, .18, "triangle", .06, 180); tono(300, .03, .2, "sine", .05, 90); }
  function suonoTic() { tono(1300, 0, .05, "triangle", .05); }
  function suonoAbbocca() { tono(220, 0, .2, "sine", .12, 90); tono(1600, 0, .08, "square", .03); }
  function suonoMulinello() { tono(1800 + Math.random() * 300, 0, .025, "square", .015); }
  function suonoSpezza() { tono(160, 0, .35, "sawtooth", .08, 50); }
  function suonoPreso(r) { [0, 4, 7, 12, 16].slice(0, 2 + r).forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * .08, .3, "triangle", .09); }); }
  function suonoMonete() { [0, 7, 12].forEach(function (k, i) { tono(1046 * Math.pow(2, k / 12), i * .06, .15, "triangle", .07); }); }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }   // solo quando si tocca

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  // =========================================================
  //  LA SCHERMATA DEL LAGHETTO
  // =========================================================
  function crea(opts) {
    stile();
    AUDIO = opts.audio || null;
    var D = opts.dati && opts.dati.v ? opts.dati : datiIniziali();
    D.album = D.album || {}; D.cesto = D.cesto || []; D.esche = D.esche || { g: oggi(), usate: 0 }; D.extra = D.extra || 0; D.tot = D.tot || 0;
    function salva() { if (opts.salva) opts.salva(D); }
    function eschePronte() { if (D.esche.g !== oggi()) D.esche = { g: oggi(), usate: 0 }; return Math.max(0, ESCHE_GIORNO - D.esche.usate) + D.extra; }
    function usaEsca() { if (D.esche.g !== oggi()) D.esche = { g: oggi(), usate: 0 }; if (D.esche.usate < ESCHE_GIORNO) D.esche.usate++; else D.extra = Math.max(0, D.extra - 1); salva(); aggTesta(); }
    function monete() { return opts.monete ? opts.monete() : 0; }

    var s = el("div", "schermata pe-vista"), cv = el("canvas", "pe-tela"), ctx = cv.getContext("2d");
    var testa = el("div", "pe-testa"), bInd = el("button", "pe-tasto", "‹"), nome = el("div", "pe-nome"), cEsche = el("div", "pe-chip"), cMonete = el("div", "pe-chip");
    bInd.setAttribute("aria-label", "Indietro"); bInd.onclick = function () { esci(); };
    [bInd, nome, cEsche, cMonete].forEach(function (n) { testa.appendChild(n); });
    var giu = el("div", "pe-giu"), bAlbum = el("button", "pe-bott", "📖 Album"), bCesto = el("button", "pe-bott");
    bAlbum.onclick = function () { album(); }; bCesto.onclick = function () { cesto(); };
    giu.appendChild(bAlbum); giu.appendChild(bCesto);
    var aiuto = el("div", "pe-aiuto"), avviso = el("div", "pe-avviso"), sopra = el("div", "pe-sopra");
    [cv, testa, giu, aiuto, avviso, sopra].forEach(function (n) { s.appendChild(n); });
    var FASE = fase();
    nome.textContent = "🎣 Laghetto " + (FASE === "notte" ? "🌙" : FASE === "tramonto" ? "🌅" : "☀️");
    function aggTesta() {
      cEsche.textContent = "🪱 " + eschePronte(); cMonete.textContent = "🪙 " + cifre(monete());
      bCesto.textContent = "🧺 Cesto" + (D.cesto.length ? " (" + D.cesto.length + ")" : "");
    }
    function dimmi(t) { avviso.textContent = t; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    function suggerisci(t) { if (aiuto.textContent !== t) aiuto.textContent = t; aiuto.style.opacity = t ? "1" : "0"; }
    function vivo() { return document.body.contains(cv); }

    // ---- misure ----
    var S = 3, ox = 0, oy = 0, cw = 360, ch = 640, dpr = 1, sfondo = null, figura = null;
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      cw = s.clientWidth || 360; ch = s.clientHeight || 640; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      S = Math.min(cw / W, ch / 165); ox = (cw - W * S) / 2; oy = ch - H * S;
      sfondo = null;
    }
    window.addEventListener("resize", misura);
    function X(x) { return ox + x * S; } function Y(y) { return oy + y * S; }
    // l'avatar sul pontile (un'immagine: si disegna una volta)
    if (opts.omino && window.SGOmino) try { figura = new Image(); figura.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(opts.omino)); } catch (e) { figura = null; }

    // ---- lo sfondo: cielo, colline, acqua, fondo, pontile (disegnato una volta sola) ----
    function disegnaSfondo() {
      var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; var x = c.getContext("2d"), i, g;
      x.scale(dpr, dpr);
      var notte = FASE === "notte", tram = FASE === "tramonto", ys = Y(SUP);
      g = x.createLinearGradient(0, 0, 0, ys);
      if (notte) { g.addColorStop(0, "#070a24"); g.addColorStop(1, "#28306b"); } else if (tram) { g.addColorStop(0, "#5f3c8f"); g.addColorStop(.6, "#ff8f5c"); g.addColorStop(1, "#ffd29a"); } else { g.addColorStop(0, "#5cb5ee"); g.addColorStop(1, "#d6f0ff"); }
      x.fillStyle = g; x.fillRect(0, 0, cw, ys + 2);
      if (notte) { for (i = 0; i < 70; i++) { x.fillStyle = "rgba(255,255,255," + (.3 + (i * 37 % 10) / 15) + ")"; x.beginPath(); x.arc((i * 97) % cw, ((i * 53) % Math.max(10, ys - 30)), (i % 3) * .5 + .6, 0, 7); x.fill(); } x.fillStyle = "#f1f3f5"; x.beginPath(); x.arc(X(80), Y(18), 6 * S, 0, 7); x.fill(); x.fillStyle = "#28306b"; x.beginPath(); x.arc(X(82.5), Y(16.5), 5.5 * S, 0, 7); x.fill(); }
      else if (tram) { var gs = x.createRadialGradient(X(70), Y(52), 0, X(70), Y(52), 30 * S); gs.addColorStop(0, "rgba(255,240,180,.95)"); gs.addColorStop(1, "rgba(255,200,120,0)"); x.fillStyle = gs; x.fillRect(0, 0, cw, ys); x.fillStyle = "#ffd43b"; x.beginPath(); x.arc(X(70), Y(54), 8 * S, Math.PI, 0); x.fill(); }
      else { var gl = x.createRadialGradient(X(82), Y(14), 0, X(82), Y(14), 22 * S); gl.addColorStop(0, "rgba(255,250,210,.95)"); gl.addColorStop(1, "rgba(255,250,210,0)"); x.fillStyle = gl; x.fillRect(0, 0, cw, ys); x.fillStyle = "#fff3b0"; x.beginPath(); x.arc(X(82), Y(14), 6 * S, 0, 7); x.fill(); }
      // le colline e gli alberi lontani
      [["#6aa84f", 46, 4, .9], ["#4f8a3c", 52, 3, 1.4]].forEach(function (h, k) {
        var col = notte ? (k ? "#1c2a3a" : "#24364a") : tram ? (k ? "#5e6e3a" : "#7a8a4a") : h[0];
        x.fillStyle = col; x.beginPath(); x.moveTo(0, ys + 1);
        for (var xx = -10; xx <= W + 10; xx += 2) x.lineTo(X(xx), Y(h[1] + Math.sin(xx / 9 * h[3] + k * 2) * h[2] + Math.sin(xx / 4.1 + k) * .8));
        x.lineTo(cw, ys + 1); x.lineTo(cw, ys + 1); x.closePath(); x.fill();
        if (k) for (var ti = 0; ti < 9; ti++) { var tx = 30 + ti * 8 + (ti % 3) * 2, ty = h[1] + Math.sin(tx / 9 * h[3] + 2) * h[2] - 2; x.fillStyle = mix(col, "#000000", .15); x.beginPath(); x.moveTo(X(tx - 2), Y(ty + 2)); x.lineTo(X(tx), Y(ty - 5 - (ti % 2) * 2)); x.lineTo(X(tx + 2), Y(ty + 2)); x.fill(); }
      });
      // l'acqua: più scura in fondo, coi raggi di luce di giorno
      g = x.createLinearGradient(0, ys, 0, ch);
      if (notte) { g.addColorStop(0, "#1b3a5c"); g.addColorStop(1, "#06121f"); } else if (tram) { g.addColorStop(0, "#c27b5a"); g.addColorStop(.08, "#3f7a8c"); g.addColorStop(1, "#0c2a3a"); } else { g.addColorStop(0, "#58b4d6"); g.addColorStop(1, "#0d4a66"); }
      x.fillStyle = g; x.fillRect(0, ys, cw, ch - ys);
      if (!notte) { x.globalAlpha = tram ? .08 : .12; x.fillStyle = "#ffffff"; for (i = 0; i < 5; i++) { var rx = X(30 + i * 16); x.beginPath(); x.moveTo(rx - 3 * S, ys); x.lineTo(rx + 2 * S, ys); x.lineTo(rx + 14 * S, ys + 70 * S); x.lineTo(rx + 4 * S, ys + 70 * S); x.closePath(); x.fill(); } x.globalAlpha = 1; }
      // il fondo del lago: sabbia e fango, sassi e alghe
      x.fillStyle = notte ? "#2a2416" : "#8a7444"; x.beginPath(); x.moveTo(0, ch); x.lineTo(0, Y(yFondo(0)));
      for (var fx = 0; fx <= W + 20; fx += 2) x.lineTo(X(fx), Y(yFondo(fx) + Math.sin(fx * 1.7) * .6));
      x.lineTo(cw, ch); x.closePath(); x.fill();
      x.fillStyle = notte ? "#3a3220" : "#a38d58"; for (fx = 0; fx < W + 20; fx += 2) x.fillRect(X(fx), Y(yFondo(fx) + .4), S * 1.4, S * .5);
      for (i = 0; i < 18; i++) { var px = 6 + (i * 41) % 96, py = yFondo(px); x.fillStyle = notte ? "#4a4a4a" : ["#9e9e9e", "#7d7d7d", "#b0a58a"][i % 3]; x.beginPath(); x.ellipse(X(px), Y(py), S * (.8 + (i % 3) * .4), S * .55, 0, 0, 7); x.fill(); }
      for (i = 0; i < 9; i++) {   // le alghe
        var ax = 8 + i * 11 + (i % 2) * 3, ay = yFondo(ax), ah = 7 + (i * 7) % 9;
        x.strokeStyle = notte ? "#1f4a2a" : (i % 2 ? "#2f9e44" : "#37b24d"); x.lineWidth = S * .9; x.lineCap = "round"; x.beginPath(); x.moveTo(X(ax), Y(ay));
        for (var k = 1; k <= 5; k++) x.lineTo(X(ax + Math.sin(k * 1.4 + i) * 1.4), Y(ay - ah * k / 5)); x.stroke();
      }
      // le canne vicino al pontile
      for (i = 0; i < 7; i++) { var cx = 23 + i * 1.6, ch2 = 10 + (i % 3) * 3; x.strokeStyle = notte ? "#2b3a1f" : "#5c7a2a"; x.lineWidth = S * .5; x.beginPath(); x.moveTo(X(cx), Y(SUP + 3)); x.quadraticCurveTo(X(cx + .5), Y(SUP - ch2 / 2), X(cx + (i % 2 ? 1 : -.6)), Y(SUP - ch2)); x.stroke(); if (i % 2) { x.fillStyle = notte ? "#3b2f1f" : "#7a4a1f"; x.beginPath(); x.ellipse(X(cx + 1), Y(SUP - ch2 + 1.5), S * .45, S * 1.4, .1, 0, 7); x.fill(); } }
      // il pontile di legno: i pali nell'acqua e le assi
      var legno = notte ? "#4a3624" : "#a0652b", scuro = notte ? "#2e2216" : "#6b4220";
      [3, 11, 19].forEach(function (px2) { x.fillStyle = scuro; x.fillRect(X(px2 - .7), Y(SUP - 5), S * 1.4, Y(yFondo(px2)) - Y(SUP - 5)); });
      x.fillStyle = legno; x.fillRect(X(-10), Y(SUP - 6), X(PONTE) - X(-10), S * 2.2);
      x.fillStyle = scuro; for (var ax2 = -8; ax2 < PONTE; ax2 += 3) x.fillRect(X(ax2), Y(SUP - 6), S * .25, S * 2.2);
      x.fillStyle = mix(legno, "#ffffff", .2); x.fillRect(X(-10), Y(SUP - 6), X(PONTE) - X(-10), S * .4);
      sfondo = c;
    }
    function mix(a, b, t) { var p = function (h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }, A = p(a), B = p(b); return "rgb(" + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(",") + ")"; }

    // =========================================================
    //  LO STATO DELLA PESCA
    // =========================================================
    var st = { fase: "pronto", t: 0, carica: 0, caricaDir: 1, hx: 0, hy: 0, gal: { x: 0, y: 0, dip: 0 }, volo: null, attesa: 0, cerca: 0, pesce: null, lotta: null, salto: null, punta: 0 };
    var pesci = [], fx = [], lucciole = [];
    var PUNTA = { x: 33, y: 33 };   // la punta della canna (a riposo)
    function nuovoPesce(daFuori, vicinoA) {   // vicinoA: un pesce adatto a quel punto del lago, che arriva lì vicino
      var cur = null, sp = null, fv = vicinoA != null ? fracDi(vicinoA) : null;
      if (Math.random() < .07) { var tot = 0; CURIOSITA.forEach(function (q) { tot += q.peso; }); var r = Math.random() * tot; for (var i = 0; i < CURIOSITA.length; i++) { r -= CURIOSITA[i].peso; if (r <= 0) { cur = CURIOSITA[i]; break; } } }
      if (!cur) {
        var ok = PESCI.filter(function (p) { return adesso(p, FASE) && (fv == null || (fv >= p.dove[0] - .08 && fv <= p.dove[1] + .08)); }), totp = 0;
        if (!ok.length) ok = PESCI.filter(function (p) { return p.r === 1 && p.quando === "sempre"; });
        ok.forEach(function (p) { totp += PESO_R[p.r]; });
        var rr = Math.random() * totp; for (var j = 0; j < ok.length; j++) { rr -= PESO_R[ok[j].r]; if (rr <= 0) { sp = ok[j]; break; } }
        sp = sp || ok[0];
      }
      var dove = cur ? [0, 1] : sp.dove, frac = dove[0] + Math.random() * (dove[1] - dove[0]);
      var x = daFuori ? W + 6 : 26 + frac * 68 + (Math.random() - .5) * 6, yb = yFondo(Math.min(W, x)), alto = Math.max(4, Math.min(22, yb - SUP - 8));
      var cm = cur ? 0 : Math.round(sp.cm[0] + Math.pow(Math.random(), 1.6) * (sp.cm[1] - sp.cm[0]));   // i più grossi sono più rari
      var L = cur ? 3 : 1.6 + 1.7 * Math.log(Math.max(5, cm) / 4);
      if (vicinoA != null) { x = Math.max(24, Math.min(W - 2, vicinoA + (Math.random() < .5 ? -1 : 1) * (9 + Math.random() * 5))); yb = yFondo(x); alto = Math.max(4, Math.min(22, yb - SUP - 8)); }
      var p = { sp: sp, cur: cur, cm: cm, L: L, x: x, y0: yb - 3 - Math.random() * alto, vx: (daFuori ? -1 : (Math.random() < .5 ? -1 : 1)) * (1.6 + Math.random() * 2.4), t: Math.random() * 9, stato: "gira", meta: frac };
      p.y = p.y0; p.min = Math.max(24, 26 + dove[0] * 68 - 8); p.max = Math.min(W - 2, 26 + dove[1] * 68 + 8);
      return p;
    }
    for (var ip = 0; ip < 7; ip++) pesci.push(nuovoPesce(false));
    if (FASE !== "giorno") for (var il = 0; il < 10; il++) lucciole.push({ x: 18 + Math.random() * 40, y: SUP - 4 - Math.random() * 14, t: Math.random() * 10 });

    function goccia(x, y, n, col) { for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + (Math.random() - .5) * 2.2, v = 8 + Math.random() * 16; fx.push({ t: "g", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vita: .6 + Math.random() * .3, col: col || "rgba(220,240,255,.9)" }); } }
    function onda(x, y) { fx.push({ t: "o", x: x, y: y, r: 0, vita: 1 }); }
    function bolla(x, y) { fx.push({ t: "b", x: x, y: y, vy: -6 - Math.random() * 6, vita: 1.6 }); }

    // ---- il tocco: tieni premuto per lanciare / tocca per ferrare / tieni premuto per tirare ----
    var premuto = false;
    cv.addEventListener("pointerdown", function (e) {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      try { if (AUDIO) AUDIO(); } catch (er2) {}
      if (sopra.classList.contains("su")) return;
      premuto = true;
      if (st.fase === "pronto") {
        if (eschePronte() <= 0) { premuto = false; return finiteEsche(); }
        st.fase = "carica"; st.carica = 0; st.caricaDir = 1;
      } else if (st.fase === "attesa") ferra();
    });
    function lascia() {
      if (!premuto) return; premuto = false;
      if (st.fase === "carica") lancia();
    }
    cv.addEventListener("pointerup", lascia); cv.addEventListener("pointercancel", lascia);

    // ---- 1. il lancio ----
    function lancia() {
      var p = st.carica, tx = 27 + p * 68;
      st.fase = "volo"; st.volo = { t: 0, dur: .55 + p * .45, x0: PUNTA.x, y0: PUNTA.y, x1: tx, y1: SUP };
      suonoLancio(); vibra(8);
    }
    // ---- 2. l'attesa: i pesci vicini si accorgono dell'esca ----
    function inAcqua() {
      var v = st.volo; st.fase = "attesa"; st.hx = v.x1; st.hy = yFondo(v.x1) - 4; st.gal = { x: v.x1, y: SUP, dip: 0 }; st.attesa = 0; st.cerca = 0; st.pesce = null; st.affondo = 0;
      suonoSplash(); goccia(v.x1, SUP, 10); onda(v.x1, SUP);
      suggerisci("Aspetta che abbocchi… quando il galleggiante va giù, tocca!");
    }
    function cercaPesce(dt) {
      st.cerca -= dt; if (st.cerca > 0 || st.pesce) return; st.cerca = .6;
      var vicini = pesci.filter(function (p) { return p.stato === "gira" && Math.abs(p.x - st.hx) < 18 && Math.abs(p.y - st.hy) < 24; });
      var scelto = null;
      if (vicini.length && Math.random() < .45) scelto = vicini[Math.floor(Math.random() * vicini.length)];
      else if (st.attesa > 2.5 + Math.random() * 1.5) {   // nessuno si è accorto: ne arriva uno dal buio lì vicino (non si aspetta troppo)
        scelto = nuovoPesce(false, st.hx);
        if (pesci.length >= 9) { var lontano = pesci.filter(function (p) { return p.stato === "gira"; }).sort(function (a, b) { return Math.abs(b.x - st.hx) - Math.abs(a.x - st.hx); })[0]; pesci = pesci.filter(function (p) { return p !== lontano; }); }   // (non troppi pesci nel lago)
        pesci.push(scelto);
      }
      if (scelto) { scelto.stato = "va"; scelto.assaggi = 1 + Math.floor(Math.random() * (scelto.sp && scelto.sp.r >= 3 ? 4 : 3)); scelto.tAss = 0; st.pesce = scelto; }
    }
    function ferra() {   // il tocco durante l'attesa
      var p = st.pesce;
      if (p && p.stato === "abbocca") {   // preso all'amo!
        p.stato = "amo"; usaEsca(); vibra(20); suonoAbbocca();
        var forza = p.cur ? .45 : p.sp.forza;
        st.fase = "lotta"; st.lotta = { d: 1, tens: .15, forza: forza, strappo: 0, prossimo: 1 + Math.random() * 1.2, avviso: 0, mul: 0, t: 0 };
        goccia(st.gal.x, SUP, 8); onda(st.gal.x, SUP);
        suggerisci("Tieni premuto per tirare · molla quando il filo è rosso o vedi ❗");
        return;
      }
      // troppo presto (o niente in vista): si ritira la lenza e il pesce scappa
      if (p) { p.stato = "fugge"; dimmi("Troppo presto! Il pesce è scappato 💨"); }
      else dimmi("Hai ritirato la lenza");
      fine(false);
    }
    // ---- 3. la lotta: tensione del filo ----
    function lotta(dt) {
      var L = st.lotta, f = L.forza; L.t += dt;
      L.prossimo -= dt;
      // (numeri provati con tante lotte simulate: i comuni in 4-5 secondi, i leggendari in 14-17 e solo chi reagisce svelto li prende sempre)
      if (!L.strappo && L.prossimo <= .4 && !L.avviso) L.avviso = 1;   // ❗ un attimo prima dello strattone
      if (L.prossimo <= 0 && !L.strappo) { L.strappo = .35 + Math.random() * .25; L.avviso = 0; goccia(posPesce().x, posPesce().y, 3, "rgba(255,255,255,.8)"); }
      if (L.strappo) { L.strappo -= dt; if (L.strappo <= 0) { L.strappo = 0; L.prossimo = (2.4 - .25 * f) * (.7 + Math.random() * .6); } }
      var fatica = .6 + .4 * L.d;   // più è vicino, meno tira
      if (premuto) {
        L.d -= .3 / (.7 + .25 * f) * dt;   // i pesci forti si tirano su più piano
        L.tens += (.14 * f * fatica + (L.strappo ? .6 * f : 0)) * dt;
        L.mul -= dt; if (L.mul <= 0) { L.mul = .08; suonoMulinello(); }
      } else {
        L.tens -= 1.0 * dt;
        L.d += (.015 * f + (L.strappo ? .05 * f : 0)) * dt;
      }
      L.tens = Math.max(0, L.tens);
      if (L.tens >= 1 || L.d >= 1.3) {   // il filo si spezza, o il pesce si slaccia: scappa da dov'è
        var q = posPesce(); st.pesce.x = q.x; st.pesce.y = q.y; st.pesce.stato = "fugge";
        if (L.tens >= 1) { suonoSpezza(); dimmi("Il filo si è spezzato! 💥"); } else dimmi("Si è slacciato ed è scappato… 🐟💨");
        return fine(false);
      }
      if (L.d <= 0) return preso();
    }
    function posPesce() {   // durante la lotta: tra l'amo e il pontile
      var L = st.lotta, d = Math.max(0, Math.min(1.3, L.d)), tx = PONTE + 3, ty = SUP + 3;
      var x = tx + (st.hx - tx) * Math.min(1, d) + (d > 1 ? (d - 1) * 10 : 0), y = ty + (st.hy - ty) * Math.min(1, d);
      var sc = L.strappo ? Math.sin(st.t * 40) * 1.4 : Math.sin(st.t * 8) * .4;
      return { x: x + sc, y: y + Math.cos(st.t * 31) * (L.strappo ? .8 : .2) };
    }
    // ---- 4. preso! ----
    function preso() {
      var p = st.pesce, q = posPesce();
      st.fase = "salto"; st.salto = { t: 0, x0: q.x, y0: q.y, p: p };
      goccia(q.x, SUP, 14); onda(q.x, SUP); suonoSplash();
      p.stato = "preso"; pesci = pesci.filter(function (x) { return x !== p; });
      setTimeout(function () { if (vivo()) pesci.push(nuovoPesce(true)); }, 2500);
    }
    function fine(bene) {   // la pescata è finita (senza pesce): si ricomincia
      st.fase = "pronto"; st.lotta = null; st.volo = null;
      if (st.pesce && st.pesce.stato !== "fugge" && st.pesce.stato !== "preso") st.pesce.stato = "gira";
      st.pesce = null; premuto = false;
      suggerisci(eschePronte() > 0 ? "Tieni premuto per caricare il lancio, poi lascia" : "Esche finite per oggi");
      aggTesta();
    }

    // ---- la carta del pesce preso ----
    function carta(p) {
      svuota(); st.fase = "carta"; suggerisci("");
      var box = el("div", "pe-carta"), sp = p.sp, cur = p.cur;
      D.tot++;
      if (cur) {
        var a = D.album["c:" + cur.id] || { n: 0 }, nuovo = !a.n; a.n++; D.album["c:" + cur.id] = a;
        var soldi = cur.id === "forziere" ? 300 + Math.round(Math.random() * 12) * 100 : cur.prezzo;
        box.appendChild(el("div", "pe-ico", cur.ico));
        box.appendChild(el("h2", null, cur.nome));
        if (nuovo) box.appendChild(el("div", "pe-nuovo", "✨ Nuovo nell'album!"));
        box.appendChild(el("p", "pe-frase", cur.id === "bottiglia" ? MESSAGGI[Math.floor(Math.random() * MESSAGGI.length)] : cur.frase));
        var b1 = el("button", "btn btn-primario", soldi > 1 ? "Prendi 🪙 " + cifre(soldi) : "Butta via (🪙 1)");
        b1.onclick = function () { if (opts.cambia) opts.cambia(soldi); suonoMonete(); vibra(10); chiudiSopra(); salva(); aggTesta(); fine(true); };
        box.appendChild(el("div", "pe-tasti")).appendChild(b1);
      } else {
        var rec = D.album[sp.id] || { n: 0, max: 0 }, nuovoP = !rec.n, record = !nuovoP && p.cm > rec.max;
        rec.n++; rec.max = Math.max(rec.max || 0, p.cm); D.album[sp.id] = rec;
        var R = RARITA[sp.r], prezzo = valore(sp, p.cm);
        var fig = el("div", "pe-fig r" + sp.r); fig.appendChild(immaginePesce(sp, 190, 120)); box.appendChild(fig);
        var bad = el("div", "pe-rar", R[0]); bad.style.background = R[1]; box.appendChild(bad);
        box.appendChild(el("h2", null, sp.nome));
        box.appendChild(el("div", "pe-cm", p.cm + " cm"));
        if (nuovoP) box.appendChild(el("div", "pe-nuovo", "✨ Nuovo nell'album!")); else if (record) box.appendChild(el("div", "pe-nuovo", "🏅 Il più grosso che hai preso!"));
        var tasti = el("div", "pe-tasti"), bv = el("button", "btn btn-primario", "Vendi 🪙 " + cifre(prezzo)), bt = el("button", "btn btn-fantasma", D.cesto.length < CESTO_MAX ? "🧺 Tienilo nel cesto" : "🧺 Il cesto è pieno");
        bv.onclick = function () { if (opts.cambia) opts.cambia(prezzo); suonoMonete(); vibra(10); chiudiSopra(); salva(); aggTesta(); fine(true); };
        bt.disabled = D.cesto.length >= CESTO_MAX;
        bt.onclick = function () { D.cesto.push({ id: sp.id, cm: p.cm }); vibra(10); chiudiSopra(); salva(); aggTesta(); fine(true); dimmi("Nel cesto! 🧺 Lo trovi in basso"); };
        tasti.appendChild(bv); tasti.appendChild(bt); box.appendChild(tasti);
        suonoPreso(sp.r);
      }
      salva();
      sopra.appendChild(box); sopra.classList.add("su");
    }
    function svuota() { while (sopra.firstChild) sopra.removeChild(sopra.firstChild); }
    function chiudiSopra() { sopra.classList.remove("su"); }
    function finestra(titolo, nodi, tasti) {
      svuota(); var box = el("div", "pe-carta pe-lista"); box.appendChild(el("h2", null, titolo));
      nodi.forEach(function (n) { if (n) box.appendChild(n); });
      var tt = el("div", "pe-tasti"); tasti.forEach(function (x) { var b = el("button", "btn " + (x.cls || "btn-fantasma"), x.testo); b.onclick = x.fn; if (x.off) b.disabled = true; tt.appendChild(b); }); box.appendChild(tt);
      sopra.appendChild(box); sopra.classList.add("su");
    }
    function finiteEsche() {
      var ok = monete() >= PACCO.prezzo;
      finestra("Esche finite 🪱", [el("p", "pe-frase", "Le 10 esche gratis tornano domani. Intanto puoi comprarne altre.")],
        [{ testo: "Compra " + PACCO.n + " esche · 🪙 " + cifre(PACCO.prezzo), cls: "btn-primario", off: !ok, fn: function () { if (monete() < PACCO.prezzo) return; if (opts.cambia) opts.cambia(-PACCO.prezzo); D.extra += PACCO.n; salva(); suonoMonete(); vibra(10); chiudiSopra(); aggTesta(); suggerisci("Tieni premuto per caricare il lancio, poi lascia"); } },
          { testo: "Va bene", fn: chiudiSopra }]);
    }
    // ---- l'album: tutti i pesci (quelli presi col disegno, gli altri in ombra con un indizio) ----
    function album() {
      if (st.fase !== "pronto" && st.fase !== "carta") return dimmi("Finisci prima la pescata");
      var presi = PESCI.filter(function (p) { return D.album[p.id]; }).length, griglia = el("div", "pe-album");
      PESCI.forEach(function (sp) {
        var a = D.album[sp.id], c = el("div", "pe-voce" + (a ? " r" + sp.r : " buio"));
        if (a) { c.appendChild(immaginePesce(sp, 70, 44)); c.appendChild(el("b", null, sp.nome)); c.appendChild(el("small", null, "🏅 " + a.max + " cm · presi " + a.n)); }
        else { var ombra = el("div", "pe-ombra", "?"); c.appendChild(ombra); c.appendChild(el("b", null, "???")); c.appendChild(el("small", null, indizio(sp))); }
        griglia.appendChild(c);
      });
      var cur = el("div", "pe-curio");
      CURIOSITA.forEach(function (q) { var a = D.album["c:" + q.id]; cur.appendChild(el("span", a ? "" : "buio", a ? q.ico + " " + q.nome + " ×" + a.n : "❔ ???")); });
      finestra("📖 Album dei pesci · " + presi + "/" + PESCI.length, [griglia, el("div", "pe-sottot", "Curiosità"), cur], [{ testo: "Chiudi", cls: "btn-primario", fn: chiudiSopra }]);
    }
    function indizio(sp) {
      var dove = sp.dove[0] >= .55 ? "al largo" : sp.dove[1] <= .6 ? "vicino al pontile" : "a metà lago";
      var quando = { sempre: "a ogni ora", giorno: "di giorno", notte: "di notte", tramonto: "al tramonto" }[sp.quando];
      return RARITA[sp.r][0] + " · " + quando + ", " + dove;
    }
    // ---- il cesto: i pesci tenuti (poi andranno nell'acquario di casa); si vendono quando vuoi ----
    function cesto() {
      if (st.fase !== "pronto" && st.fase !== "carta") return dimmi("Finisci prima la pescata");
      var lista = el("div", "pe-cesto"), tot = 0;
      if (!D.cesto.length) lista.appendChild(el("p", "pe-frase", "Il cesto è vuoto. Quando prendi un pesce puoi tenerlo qui invece di venderlo."));
      D.cesto.forEach(function (f, i) {
        var sp = pesce(f.id); if (!sp) return; var v = valore(sp, f.cm); tot += v;
        var r = el("div", "pe-riga"); r.appendChild(immaginePesce(sp, 46, 30)); r.appendChild(el("span", null, sp.nome + " · " + f.cm + " cm"));
        var b = el("button", "pe-vendi", "🪙 " + cifre(v)); b.onclick = function () { D.cesto.splice(i, 1); if (opts.cambia) opts.cambia(v); suonoMonete(); vibra(8); salva(); aggTesta(); cesto(); };
        r.appendChild(b); lista.appendChild(r);
      });
      finestra("🧺 Il cesto · " + D.cesto.length + "/" + CESTO_MAX, [lista, el("p", "pe-nota", "Presto potrai metterli nell'acquario di casa.")],
        [{ testo: "Vendi tutto · 🪙 " + cifre(tot), cls: "btn-primario", off: !D.cesto.length, fn: function () { if (opts.cambia) opts.cambia(tot); D.cesto = []; suonoMonete(); vibra(10); salva(); aggTesta(); chiudiSopra(); } },
          { testo: "Chiudi", fn: chiudiSopra }]);
    }
    function esci() {
      if (st.fase === "lotta" || st.fase === "attesa" || st.fase === "volo") { if (st.pesce) st.pesce.stato = "fugge"; fine(false); }
      chiudi(); if (opts.indietro) opts.indietro();
    }

    // =========================================================
    //  IL GIRO: muove tutto e disegna
    // =========================================================
    var ult = performance.now(), anim = 0;
    function giro(ora) {
      if (!vivo()) return;
      var dt = Math.min(.05, (ora - ult) / 1000); ult = ora;
      aggiorna(dt); disegna();
      anim = requestAnimationFrame(giro);
    }
    function aggiorna(dt) {
      st.t += dt;
      if (st.fase === "carica") { st.carica += st.caricaDir * dt / .9; if (st.carica >= 1) { st.carica = 1; st.caricaDir = -1; } if (st.carica <= 0) { st.carica = 0; st.caricaDir = 1; } }
      if (st.fase === "volo") { st.volo.t += dt; if (st.volo.t >= st.volo.dur) inAcqua(); }
      if (st.fase === "attesa") { st.attesa += dt; cercaPesce(dt); }
      if (st.fase === "lotta") lotta(dt);
      if (st.fase === "salto") { st.salto.t += dt; if (st.salto.t >= .75) carta(st.salto.p); }
      // i pesci
      pesci.forEach(function (p) {
        p.t += dt;
        if (p.stato === "gira") {
          p.x += p.vx * dt; if (p.x < p.min) p.vx = Math.abs(p.vx); if (p.x > p.max) p.vx = -Math.abs(p.vx);
          if (Math.random() < dt * .15) p.vx = -p.vx;
          p.y = p.y0 + Math.sin(p.t * 1.3) * 1.2;
        } else if (p.stato === "va") {   // verso l'esca
          var tx = st.hx + (p.x < st.hx ? -1 : 1) * (p.L * .55), ty = st.hy, dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1, v = 7;
          p.vx = dx / d * v; p.x += dx / d * Math.min(d, v * dt); p.y += dy / d * Math.min(d, v * dt);
          if (d < .6) { p.stato = "assaggia"; p.tAss = .5 + Math.random() * .7; }
        } else if (p.stato === "assaggia") {
          p.tAss -= dt;
          if (p.tAss <= 0) {
            if (p.assaggi > 0) { p.assaggi--; st.gal.dip = .55; suonoTic(); p.tAss = .6 + Math.random() * 1.1; p.x += (st.hx - p.x) * .3; onda(st.gal.x, SUP); }
            else { p.stato = "abbocca"; p.tAbb = p.sp && p.sp.r >= 3 ? .45 : .62; st.gal.dip = 1; suonoAbbocca(); goccia(st.gal.x, SUP, 6); onda(st.gal.x, SUP); }
          }
        } else if (p.stato === "abbocca") {
          p.tAbb -= dt;
          if (p.tAbb <= 0) { usaEsca(); p.stato = "fugge"; dimmi("Ha mangiato l'esca ed è scappato! Tocca appena va giù 🪱"); fine(false); }
        } else if (p.stato === "fugge") { p.vx = (p.vx >= 0 ? 1 : -1) * 22; p.x += p.vx * dt; p.y += Math.sin(p.t * 5) * dt * 3; }
      });
      pesci = pesci.filter(function (p) { if (p.stato === "fugge" && (p.x < -10 || p.x > W + 10)) { setTimeout(function () { if (vivo()) pesci.push(nuovoPesce(true)); }, 1500 + Math.random() * 2500); return false; } return true; });
      // il galleggiante
      if (st.gal.dip > 0) st.gal.dip = Math.max(st.pesce && st.pesce.stato === "abbocca" ? .85 : 0, st.gal.dip - dt * 2.2);
      // gli effetti
      fx.forEach(function (f) { f.vita -= dt; if (f.t === "g") { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 60 * dt; } else if (f.t === "o") f.r += 9 * dt; else if (f.t === "b") f.y += f.vy * dt; });
      fx = fx.filter(function (f) { return f.vita > 0 && !(f.t === "b" && f.y < SUP); });
      if (Math.random() < dt * 1.5) { var pb = pesci[Math.floor(Math.random() * pesci.length)]; if (pb) bolla(pb.x, pb.y - 1); }
      if (st.fase === "attesa" || st.fase === "lotta") suggerisci(st.fase === "lotta" ? (st.lotta.tens > .8 ? "Molla! Il filo sta per spezzarsi" : st.lotta.avviso || st.lotta.strappo ? "❗ Strattone: molla!" : "Tieni premuto per tirare") : aiuto.textContent);
    }

    // ---- il disegno ----
    function disegna() {
      if (!sfondo) disegnaSfondo();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sfondo, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var notte = FASE === "notte";
      // le ombre dei pesci (di che pesce si tratta lo scopri solo quando lo prendi)
      pesci.forEach(function (p) {
        if (p.stato === "preso") return;
        var pos = st.fase === "lotta" && p === st.pesce ? posPesce() : p, dir = p.vx >= 0 ? 1 : -1;
        if (st.fase === "lotta" && p === st.pesce) dir = st.lotta.strappo ? (Math.sin(st.t * 20) > 0 ? 1 : -1) : 1;
        ombra(pos.x, pos.y, p.L, dir, notte ? "rgba(0,4,16,.6)" : "rgba(8,30,48,.42)");
      });
      // la superficie che si muove
      ctx.strokeStyle = notte ? "rgba(150,180,255,.35)" : "rgba(255,255,255,.55)"; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var x = PONTE; x <= W + 10; x += 2) { var yy = SUP + Math.sin(x * .5 + st.t * 2) * .25; if (x === PONTE) ctx.moveTo(X(x), Y(yy)); else ctx.lineTo(X(x), Y(yy)); }
      ctx.stroke();
      // gli effetti nell'acqua e sopra
      fx.forEach(function (f) {
        if (f.t === "o") { ctx.globalAlpha = Math.max(0, f.vita) * .7; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(X(f.x), Y(f.y), f.r * S, f.r * S * .25, 0, 0, 7); ctx.stroke(); }
        else if (f.t === "g") { ctx.globalAlpha = Math.min(1, f.vita * 2); ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(X(f.x), Y(f.y), S * .35, 0, 7); ctx.fill(); }
        else if (f.t === "b") { ctx.globalAlpha = .5; ctx.strokeStyle = "#e7f5ff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X(f.x), Y(f.y), S * .45, 0, 7); ctx.stroke(); }
      });
      ctx.globalAlpha = 1;
      // l'avatar sul pontile e la canna
      var fw = 16 * S, fh = fw * 1.32, fx0 = X(12) - fw / 2, fy0 = Y(SUP - 6) - fh * .96;
      if (figura && figura.complete && figura.naturalWidth) ctx.drawImage(figura, fx0, fy0, fw, fh);
      else { ctx.fillStyle = "#4c6ef5"; ctx.fillRect(X(10), Y(SUP - 24), S * 4, S * 18); }
      var mano = { x: 15.2, y: SUP - 15.5 }, punta = puntaCanna();
      ctx.strokeStyle = "#5c3d1e"; ctx.lineWidth = Math.max(2, S * .7); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(X(mano.x - 2), Y(mano.y + 2.5)); ctx.quadraticCurveTo(X((mano.x + punta.x) / 2), Y(Math.min(mano.y, punta.y) - 1 - piega() * 3), X(punta.x), Y(punta.y)); ctx.stroke();
      ctx.fillStyle = "#adb5bd"; ctx.beginPath(); ctx.arc(X(mano.x - .3), Y(mano.y + 1.2), S * .9, 0, 7); ctx.fill();   // il mulinello
      // il filo e il galleggiante
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1;
      if (st.fase === "volo") {
        var v = st.volo, k = v.t / v.dur, bx = v.x0 + (v.x1 - v.x0) * k, by = v.y0 + (v.y1 - v.y0) * k - Math.sin(k * Math.PI) * (12 + (v.x1 - v.x0) * .25);
        ctx.beginPath(); ctx.moveTo(X(punta.x), Y(punta.y)); ctx.quadraticCurveTo(X((punta.x + bx) / 2), Y(Math.min(punta.y, by) - 3), X(bx), Y(by)); ctx.stroke();
        galleggiante(bx, by);
      } else if (st.fase === "attesa") {
        var gy = SUP + st.gal.dip * 1.6;
        ctx.beginPath(); ctx.moveTo(X(punta.x), Y(punta.y)); ctx.quadraticCurveTo(X((punta.x + st.gal.x) / 2), Y(SUP - 2), X(st.gal.x), Y(gy)); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.moveTo(X(st.gal.x), Y(gy)); ctx.lineTo(X(st.hx), Y(st.hy)); ctx.stroke();
        amo(st.hx, st.hy); galleggiante(st.gal.x, gy);
      } else if (st.fase === "lotta") {
        var q = posPesce(), teso = st.lotta.tens;
        ctx.strokeStyle = teso > .8 ? "#ff6b6b" : teso > .55 ? "#ffd43b" : "rgba(255,255,255,.85)"; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(X(punta.x), Y(punta.y)); ctx.lineTo(X(q.x), Y(q.y)); ctx.stroke();
        if (st.lotta.avviso || st.lotta.strappo) { ctx.font = "900 " + Math.round(5 * S) + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ff6b6b"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.strokeText("❗", X(q.x), Y(q.y - 4)); ctx.fillText("❗", X(q.x), Y(q.y - 4)); }
        tensione(teso, st.lotta.d);
      } else if (st.fase === "salto") {
        var sl = st.salto, kk = Math.min(1, sl.t / .75), sx = sl.x0 + (12 - sl.x0) * kk, sy = sl.y0 + (SUP - 22 - sl.y0) * kk - Math.sin(kk * Math.PI) * 18;
        ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.moveTo(X(punta.x), Y(punta.y)); ctx.lineTo(X(sx), Y(sy)); ctx.stroke();
        ctx.save(); ctx.translate(X(sx), Y(sy)); ctx.rotate(-.6 + kk * 1.4);
        if (sl.p.sp) disegnaPesce(ctx, sl.p.sp, Math.max(6, sl.p.L * 1.3) * S); else { ctx.font = Math.round(7 * S) + "px system-ui"; ctx.textAlign = "center"; ctx.fillText(sl.p.cur.ico, 0, 0); }
        ctx.restore();
      }
      // la forza del lancio
      if (st.fase === "carica") {
        var bx2 = X(4), by2 = Y(SUP - 40), bw = S * 3, bh = S * 22;
        ctx.fillStyle = "rgba(0,0,0,.45)"; arrot(ctx, bx2, by2, bw, bh, bw / 2); ctx.fill();
        var gk = ctx.createLinearGradient(0, by2 + bh, 0, by2); gk.addColorStop(0, "#51cf66"); gk.addColorStop(.6, "#ffd43b"); gk.addColorStop(1, "#ff6b6b");
        ctx.fillStyle = gk; arrot(ctx, bx2 + 2, by2 + 2 + (bh - 4) * (1 - st.carica), bw - 4, (bh - 4) * st.carica, (bw - 4) / 2); ctx.fill();
        // dove arriva, più o meno
        var tx2 = 27 + st.carica * 68; ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.ellipse(X(tx2), Y(SUP), S * 2.2, S * .6, 0, 0, 7); ctx.fill();
      }
      // le lucciole (sera e notte)
      lucciole.forEach(function (l) { var a = .4 + .6 * Math.abs(Math.sin(st.t * 1.7 + l.t)); ctx.globalAlpha = a; ctx.fillStyle = "#fff59d"; ctx.beginPath(); ctx.arc(X(l.x + Math.sin(st.t * .6 + l.t) * 3), Y(l.y + Math.cos(st.t * .8 + l.t) * 2), S * .45, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    function piega() { return st.fase === "lotta" ? Math.min(1.4, st.lotta.tens * 1.2 + (st.lotta.strappo ? .5 : 0)) : st.fase === "carica" ? -st.carica * .6 : 0; }
    function puntaCanna() {
      if (st.fase === "carica") return { x: PUNTA.x - st.carica * 14, y: PUNTA.y - 6 - st.carica * 4 };   // la canna va indietro mentre carichi
      if (st.fase === "lotta") { var b = piega(); return { x: PUNTA.x - 2 - b * 3, y: PUNTA.y + 4 + b * 7 }; }
      return PUNTA;
    }
    function ombra(x, y, L, dir, col) {
      ctx.save(); ctx.translate(X(x), Y(y)); ctx.scale(dir, 1); var l = L * S, h = l * .32;
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, l / 2, h / 2, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-l * .42, 0); ctx.lineTo(-l * .7, -h * .5); ctx.lineTo(-l * .7, h * .5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function galleggiante(x, y) {
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(X(x), Y(y), S * .9, 0, Math.PI); ctx.fill();
      ctx.fillStyle = "#fa5252"; ctx.beginPath(); ctx.arc(X(x), Y(y), S * .9, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X(x), Y(y), S * .9, 0, 7); ctx.stroke();
    }
    function amo(x, y) { ctx.strokeStyle = "#ced4da"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X(x), Y(y + .6), S * .5, -1.2, Math.PI * .9); ctx.stroke(); ctx.fillStyle = "#e599f7"; ctx.beginPath(); ctx.arc(X(x + .3), Y(y + 1.1), S * .35, 0, 7); ctx.fill(); }
    function tensione(t, d) {   // a destra: quanto è teso il filo e quanto manca
      var bx = cw - S * 6, by = Y(SUP + 6), bw = S * 3, bh = Math.min(S * 60, ch - by - 80);
      ctx.fillStyle = "rgba(0,0,0,.45)"; arrot(ctx, bx, by, bw, bh, bw / 2); ctx.fill();
      ctx.fillStyle = "rgba(255,107,107,.35)"; ctx.fillRect(bx + 2, by + 2, bw - 4, (bh - 4) * .2);
      var col = t > .8 ? "#ff6b6b" : t > .55 ? "#ffd43b" : "#51cf66";
      ctx.fillStyle = col; arrot(ctx, bx + 2, by + 2 + (bh - 4) * (1 - Math.min(1, t)), bw - 4, (bh - 4) * Math.min(1, t), (bw - 4) / 2); ctx.fill();
      ctx.font = "900 " + Math.round(2.6 * S) + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText("filo", bx + bw / 2, by - S * 1.2);
      // quanto manca al pontile
      var px = X(PONTE + 4), pw = X(W - 6) - px, py = Y(SUP + 2.5);
      ctx.fillStyle = "rgba(0,0,0,.35)"; arrot(ctx, px, py - S * .6, pw, S * 1.2, S * .6); ctx.fill();
      ctx.fillStyle = "#74c0fc"; arrot(ctx, px, py - S * .6, pw * Math.max(0, Math.min(1, 1 - d)), S * 1.2, S * .6); ctx.fill();
    }
    function arrot(x, a, b, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    function chiudi() { cancelAnimationFrame(anim); window.removeEventListener("resize", misura); }

    s._monta = function () {
      misura(); aggTesta();
      suggerisci(eschePronte() > 0 ? "Tieni premuto per caricare il lancio, poi lascia" : "Esche finite per oggi");
      if (!D.tot) dimmi("Benvenuto al laghetto! 🎣");
      anim = requestAnimationFrame(function (o) { ult = o; giro(o); });
    };
    s._chiudi = chiudi;
    window.__pesca = { st: st, pesci: function () { return pesci; }, D: D, lascia: lascia, avanza: function (sec) { for (var i = 0; i < sec * 60; i++) aggiorna(1 / 60); }, premi: function (v) { premuto = v; } };   // (per le prove)
    return s;
  }

  // ---------- lo stile (una volta sola, prefisso pe-) ----------
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.pe-vista{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;position:relative;background:#0b1033;user-select:none;-webkit-user-select:none}",
      ".pe-tela{position:absolute;inset:0;width:100%;height:100%;touch-action:none}",
      ".pe-testa{position:absolute;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:3;display:flex;align-items:center;gap:6px}",
      ".pe-tasto{flex:none;width:38px;height:38px;border:0;border-radius:12px;cursor:pointer;font:inherit;font-size:1.3rem;font-weight:900;color:#fff;background:rgba(0,0,0,.35)}",
      ".pe-nome{flex:1;min-width:0;font-weight:900;font-size:1.02rem;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".pe-chip{flex:none;height:34px;padding:0 10px;border-radius:12px;display:flex;align-items:center;font-weight:900;font-size:.92rem;color:#fff;background:rgba(0,0,0,.38)}",
      ".pe-giu{position:absolute;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:3;display:flex;gap:8px;justify-content:center}",
      ".pe-bott{flex:1;max-width:180px;height:44px;border:0;border-radius:14px;cursor:pointer;font:inherit;font-weight:900;font-size:.95rem;color:#fff;background:rgba(0,0,0,.42);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.25)}",
      ".pe-aiuto{position:absolute;left:50%;bottom:calc(64px + env(safe-area-inset-bottom));z-index:3;transform:translateX(-50%);max-width:92%;padding:7px 14px;border-radius:999px;text-align:center;font-weight:800;font-size:.85rem;color:#fff;background:rgba(0,0,0,.45);pointer-events:none;transition:opacity .3s}",
      ".pe-avviso{position:absolute;left:50%;top:calc(56px + env(safe-area-inset-top));z-index:4;transform:translateX(-50%);max-width:92%;padding:8px 14px;border-radius:999px;text-align:center;font-weight:900;font-size:.9rem;color:#1a1440;background:#ffe066;box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;pointer-events:none}",
      ".pe-avviso.su{animation:peAvv 2.6s ease forwards}",
      "@keyframes peAvv{0%{opacity:0;transform:translate(-50%,-8px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}82%{opacity:1}100%{opacity:0}}",
      ".pe-sopra{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(5,10,30,.55);opacity:0;pointer-events:none;transition:opacity .25s}",
      ".pe-sopra.su{opacity:1;pointer-events:auto}",
      ".pe-carta{width:100%;max-width:340px;max-height:calc(var(--alt,100dvh) - 40px);overflow:auto;padding:16px 14px;border-radius:22px;text-align:center;color:#fff;background:linear-gradient(180deg,#1e5a7a,#123247);box-shadow:0 12px 40px rgba(0,0,0,.5),inset 0 0 0 2px rgba(165,216,255,.35);animation:peEntra .4s cubic-bezier(.3,1.4,.5,1)}",
      "@keyframes peEntra{from{transform:scale(.6);opacity:0}}",
      ".pe-carta h2{margin:6px 0 2px;font-size:1.35rem}",
      ".pe-fig{display:flex;justify-content:center;padding:6px 0;border-radius:16px;background:radial-gradient(circle,rgba(255,255,255,.18),rgba(255,255,255,0) 70%)}",
      ".pe-fig.r3{background:radial-gradient(circle,rgba(204,93,232,.35),rgba(204,93,232,0) 70%)}.pe-fig.r4{background:radial-gradient(circle,rgba(255,212,59,.45),rgba(255,212,59,0) 70%)}",
      ".pe-rar{display:inline-block;margin-top:4px;padding:2px 10px;border-radius:999px;font-weight:900;font-size:.75rem;letter-spacing:.04em}",
      ".pe-cm{font-weight:900;font-size:1.1rem;color:#ffe066}",
      ".pe-nuovo{margin-top:6px;font-weight:900;color:#8ce99a}",
      ".pe-ico{font-size:3.4rem;line-height:1.2}",
      ".pe-frase{margin:8px 0 0;font-size:.95rem;line-height:1.4;color:#d0ebff}",
      ".pe-nota{margin:8px 0 0;font-size:.8rem;color:#a5d8ff}",
      ".pe-tasti{display:flex;flex-direction:column;gap:8px;margin-top:14px}",
      ".pe-album{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}",
      ".pe-voce{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 3px;border-radius:12px;background:rgba(255,255,255,.08);min-height:96px}",
      ".pe-voce.r2{box-shadow:inset 0 0 0 1.5px rgba(28,126,214,.7)}.pe-voce.r3{box-shadow:inset 0 0 0 1.5px rgba(156,54,181,.8)}.pe-voce.r4{box-shadow:inset 0 0 0 2px #fcc419}",
      ".pe-voce b{font-size:.7rem;line-height:1.15}.pe-voce small{font-size:.6rem;line-height:1.2;color:#a5d8ff}",
      ".pe-voce.buio{opacity:.75}",
      ".pe-ombra{width:56px;height:34px;margin:5px 0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;color:rgba(255,255,255,.6);background:rgba(0,0,0,.45)}",
      ".pe-sottot{margin:12px 0 4px;font-weight:900;font-size:.85rem;color:#a5d8ff;text-align:left}",
      ".pe-curio{display:flex;flex-wrap:wrap;gap:6px}.pe-curio span{padding:4px 9px;border-radius:999px;font-size:.78rem;font-weight:800;background:rgba(255,255,255,.12)}.pe-curio span.buio{opacity:.55}",
      ".pe-cesto{display:flex;flex-direction:column;gap:6px;margin-top:8px;text-align:left}",
      ".pe-riga{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:12px;background:rgba(255,255,255,.08);font-size:.85rem;font-weight:800}",
      ".pe-riga span{flex:1;min-width:0}",
      ".pe-vendi{flex:none;height:32px;padding:0 10px;border:0;border-radius:10px;cursor:pointer;font:inherit;font-weight:900;font-size:.8rem;color:#1a1440;background:#ffe066}"
    ].join("");
    document.head.appendChild(st);
  }

  window.SGPesca = { crea: crea, PESCI: PESCI, CURIOSITA: CURIOSITA, disegnaPesce: disegnaPesce, immaginePesce: immaginePesce };
})();
