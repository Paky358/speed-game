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
  // l'attrezzatura (si compra al laghetto): le canne reggono di più gli strattoni, le esche speciali attirano i pesci rari
  var CANNE = [
    { id: "bambu", nome: "Canna di bambù", prezzo: 0, tens: 1, tira: 1, fin: 0, col: "#5c3d1e", sotto: "Quella di partenza" },
    { id: "lago", nome: "Canna da lago", prezzo: 1500, tens: .85, tira: 1.1, fin: .05, col: "#1c7ed6", sotto: "Il filo si spezza meno e tira un po' più svelta" },
    { id: "carbonio", nome: "Canna in carbonio", prezzo: 5000, tens: .72, tira: 1.2, fin: .1, col: "#343a40", sotto: "Regge gli strattoni e ti dà più tempo quando abbocca" },
    { id: "oro", nome: "Canna d'oro", prezzo: 15000, tens: .6, tira: 1.3, fin: .15, col: "#f2b705", sotto: "La migliore: il filo quasi non si spezza" }
  ];
  var ESCHE = {
    lombrico: { nome: "Lombrico", ico: "🪱", sotto: "10 al giorno gratis", prezzo: 400 },
    colorata: { nome: "Esca colorata", ico: "🎏", sotto: "Attira più pesci rari", prezzo: 600, pesi: { 1: 40, 2: 40, 3: 14, 4: 4 } },
    luminosa: { nome: "Esca luminosa", ico: "✨", sotto: "Attira epici e leggendari", prezzo: 1800, pesi: { 1: 18, 2: 38, 3: 30, 4: 12 } }
  };
  var ORDINE_ESCHE = ["lombrico", "colorata", "luminosa"];
  function canna(id) { for (var i = 0; i < CANNE.length; i++) if (CANNE[i].id === id) return CANNE[i]; return CANNE[0]; }
  function pesce(id) { for (var i = 0; i < PESCI.length; i++) if (PESCI[i].id === id) return PESCI[i]; return null; }
  function curiosita(id) { for (var i = 0; i < CURIOSITA.length; i++) if (CURIOSITA[i].id === id) return CURIOSITA[i]; return null; }
  function adesso(sp, fase) { return sp.quando === "sempre" || sp.quando === fase || (fase === "tramonto" && sp.quando !== "tramonto" ? Math.random() < .5 : false); }   // al tramonto escono un po' quelli del giorno e un po' quelli della notte
  function valore(sp, cm) { var k = (cm - sp.cm[0]) / Math.max(1, sp.cm[1] - sp.cm[0]); return Math.round(sp.prezzo * (0.7 + 0.6 * k)); }   // i più grossi valgono di più
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }   // numeri a caso ma sempre uguali (stelle, sassi, alghe)
  // quanto pesa un pesce (per la gara): cresce col cubo della lunghezza, i pesci alti pesano di più di quelli lunghi e stretti
  var FORMA_KG = { snello: .7, normale: 1, alto: 1.35, lungo: .75, anguilla: .3, baffi: 1.05, storione: .95, gambero: 3 };
  function pesoKg(sp, cm) { return Math.max(.01, Math.round(.000012 * cm * cm * cm * (FORMA_KG[sp.forma] || 1) * 100) / 100); }
  function kg(n) { n = n || 0; return (n >= 100 ? cifre(n) : n.toFixed(n < 10 ? 2 : 1).replace(".", ",")) + " kg"; }
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
  // lo stesso pesce in SVG (per l'acquario di casa, dove nuota da solo): centrato in 0,0, guarda a destra, lungo L
  function svgPesce(id, L, pref) {
    var sp = pesce(id); if (!sp) return "";
    pref = pref || "pf";
    function n(v) { return Math.round(v * 10) / 10; }
    var col = sp.col, s = "", i;
    if (sp.forma === "gambero") {
      var hg = L * .22;
      for (i = 0; i < 6; i++) s += "<ellipse cx='" + n(-L * .32 + i * L * .09) + "' cy='0' rx='" + n(L * .07) + "' ry='" + n(hg * (.55 - i * .03)) + "' fill='" + col[0] + "' stroke='" + col[2] + "' stroke-width='" + n(Math.max(.4, L * .012)) + "'/>";
      s += "<path d='M" + n(-L * .38) + " 0 L" + n(-L * .5) + " " + n(-hg * .5) + " L" + n(-L * .5) + " " + n(hg * .5) + " Z' fill='" + col[0] + "'/>";
      s += "<ellipse cx='" + n(L * .2) + "' cy='0' rx='" + n(L * .17) + "' ry='" + n(hg * .62) + "' fill='" + col[0] + "' stroke='" + col[2] + "' stroke-width='" + n(Math.max(.4, L * .012)) + "'/>";
      s += "<ellipse cx='" + n(L * .5) + "' cy='" + n(-hg * .75) + "' rx='" + n(L * .07) + "' ry='" + n(hg * .3) + "' fill='" + col[1] + "'/><ellipse cx='" + n(L * .5) + "' cy='" + n(hg * .75) + "' rx='" + n(L * .07) + "' ry='" + n(hg * .3) + "' fill='" + col[1] + "'/>";
      return "<g>" + s + "<circle cx='" + n(L * .3) + "' cy='" + n(-hg * .25) + "' r='" + n(Math.max(.6, L * .025)) + "' fill='#111'/></g>";
    }
    var h = L * ({ snello: .26, alto: .48, lungo: .2, anguilla: .11, baffi: .3, storione: .2, normale: .34 }[sp.forma] || .34), x0 = -L / 2, x1 = L / 2, coda = sp.forma === "anguilla" ? L * .08 : L * .2;
    var corpo;
    if (sp.forma === "anguilla") corpo = "M" + n(x0 + coda * .5) + " 0 C" + n(x0 + L * .3) + " " + n(-h * 1.2) + " " + n(x1 - L * .2) + " " + n(-h * .9) + " " + n(x1) + " 0 C" + n(x1 - L * .2) + " " + n(h * .9) + " " + n(x0 + L * .3) + " " + n(h * 1.2) + " " + n(x0 + coda * .5) + " 0 Z";
    else if (sp.forma === "lungo" || sp.forma === "storione") corpo = "M" + n(x0 + coda * .5) + " 0 C" + n(x0 + L * .25) + " " + n(-h * .75) + " " + n(x1 - L * .25) + " " + n(-h * .7) + " " + n(x1) + " " + n(-h * .05) + " L" + n(x1) + " " + n(h * .05) + " C" + n(x1 - L * .25) + " " + n(h * .7) + " " + n(x0 + L * .25) + " " + n(h * .75) + " " + n(x0 + coda * .5) + " 0 Z";
    else corpo = "M" + n(x0 + coda * .5) + " 0 C" + n(x0 + L * .2) + " " + n(-h * .62) + " " + n(x1 - L * .18) + " " + n(-h * .68) + " " + n(x1) + " 0 C" + n(x1 - L * .18) + " " + n(h * .68) + " " + n(x0 + L * .2) + " " + n(h * .62) + " " + n(x0 + coda * .5) + " 0 Z";
    s += "<linearGradient id='" + pref + "g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + col[0] + "'/><stop offset='.55' stop-color='" + col[0] + "'/><stop offset='1' stop-color='" + col[1] + "'/></linearGradient>";
    s += "<clipPath id='" + pref + "c'><path d='" + corpo + "'/></clipPath>";
    s += "<path d='M" + n(x0 + coda * .6) + " 0 L" + n(x0 - coda * .5) + " " + n(-h * .55) + " Q" + n(x0 - coda * .1) + " 0 " + n(x0 - coda * .5) + " " + n(h * .55) + " Z' fill='" + col[2] + "'/>";   // la coda
    s += "<path d='M" + n(-L * .12) + " " + n(-h * .42) + " Q" + n(L * .02) + " " + n(-h * .95) + " " + n(L * .14) + " " + n(-h * .4) + " Z' fill='" + col[2] + "'/>";   // le pinne
    s += "<path d='M" + n(-L * .05) + " " + n(h * .4) + " Q" + n(L * .04) + " " + n(h * .78) + " " + n(L * .12) + " " + n(h * .38) + " Z' fill='" + col[2] + "'/>";
    s += "<path d='" + corpo + "' fill='url(#" + pref + "g)' stroke='rgba(0,0,0,.25)' stroke-width='" + n(Math.max(.4, L * .01)) + "'/>";
    var dis = "";
    if (sp.disegno === "strisce") for (i = 0; i < 6; i++) dis += "<rect x='" + n(-L * .3 + i * L * .1) + "' y='" + n(-h) + "' width='" + n(L * .04) + "' height='" + n(h * 1.3) + "' fill='rgba(20,30,10,.38)'/>";
    else if (sp.disegno === "puntini") for (i = 0; i < 14; i++) dis += "<circle cx='" + n(-L * .32 + ((i * 37) % 60) / 60 * L * .65) + "' cy='" + n(-h * .35 + ((i * 53) % 40) / 40 * h * .55) + "' r='" + n(L * .018) + "' fill='" + (sp.id === "trota" ? "#c92a2a" : "rgba(255,255,230,.55)") + "'/>";
    else if (sp.disegno === "macchie") for (i = 0; i < 5; i++) dis += "<circle cx='" + n(-L * .25 + i * L * .12) + "' cy='" + n(-h * .1 + (i % 2) * h * .12) + "' r='" + n(L * .05) + "' fill='rgba(28,126,214,.45)'/>";
    else if (sp.disegno === "squame") for (i = 0; i < 24; i++) { var qx = -L * .3 + (i % 8) * L * .08, qy = -h * .3 + Math.floor(i / 8) * h * .25, rq = L * .045; dis += "<path d='M" + n(qx + rq * Math.cos(-1.2)) + " " + n(qy + rq * Math.sin(-1.2)) + " A" + n(rq) + " " + n(rq) + " 0 0 1 " + n(qx + rq * Math.cos(1.2)) + " " + n(qy + rq * Math.sin(1.2)) + "' fill='none' stroke='rgba(0,0,0,.18)' stroke-width='" + n(Math.max(.4, L * .008)) + "'/>"; }
    else if (sp.disegno === "koi") [[-.2, -.2, .12], [.05, -.25, .1], [.18, .02, .07], [-.05, .05, .06]].forEach(function (m) { dis += "<ellipse cx='" + n(m[0] * L) + "' cy='" + n(m[1] * h * 2) + "' rx='" + n(m[2] * L) + "' ry='" + n(m[2] * L * .7) + "' fill='#f03e3e'/>"; });
    else if (sp.disegno === "arcobaleno") dis += "<rect x='" + n(-L / 2) + "' y='" + n(-h * .12) + "' width='" + n(L) + "' height='" + n(h * .24) + "' fill='rgba(230,73,128,.55)'/>";
    if (sp.forma === "storione") for (i = 0; i < 7; i++) dis += "<circle cx='" + n(-L * .3 + i * L * .1) + "' cy='" + n(-h * .32) + "' r='" + n(L * .016) + "' fill='rgba(255,255,255,.55)'/>";
    if (dis) s += "<g clip-path='url(#" + pref + "c)'>" + dis + "</g>";
    s += "<ellipse cx='" + n(L * .02) + "' cy='" + n(-h * .22) + "' rx='" + n(L * .28) + "' ry='" + n(h * .08) + "' fill='rgba(255,255,255,.25)'/>";
    var ex = x1 - L * (sp.forma === "anguilla" ? .06 : .14), ey = -h * (sp.forma === "anguilla" ? .1 : .12), er = Math.max(.7, L * (sp.forma === "anguilla" ? .022 : .035));
    s += "<circle cx='" + n(ex) + "' cy='" + n(ey) + "' r='" + n(er) + "' fill='#fff'/><circle cx='" + n(ex + er * .25) + "' cy='" + n(ey) + "' r='" + n(er * .55) + "' fill='#111'/>";
    if (sp.forma === "baffi") [[-.5, .5], [.2, .9], [.6, 1.2]].forEach(function (b) { s += "<path d='M" + n(x1 - L * .03) + " " + n(h * .08) + " Q" + n(x1 + L * .08) + " " + n(h * b[0]) + " " + n(x1 + L * .02) + " " + n(h * b[1]) + "' fill='none' stroke='" + col[2] + "' stroke-width='" + n(Math.max(.4, L * .012)) + "'/>"; });
    if (sp.disegno === "corona") { var cx = ex - L * .02, cy = -h * .6, cw = L * .1; s += "<path d='M" + n(cx - cw / 2) + " " + n(cy) + " L" + n(cx - cw / 2) + " " + n(cy - cw * .55) + " L" + n(cx - cw / 4) + " " + n(cy - cw * .25) + " L" + n(cx) + " " + n(cy - cw * .7) + " L" + n(cx + cw / 4) + " " + n(cy - cw * .25) + " L" + n(cx + cw / 2) + " " + n(cy - cw * .55) + " L" + n(cx + cw / 2) + " " + n(cy) + " Z' fill='#ffd43b' stroke='#e67700' stroke-width='" + n(Math.max(.4, L * .008)) + "'/>"; }
    return "<g>" + s + "</g>";
  }
  function immaginePesce(sp, L, alto) {   // una tela col pesce disegnato (per le carte e l'album)
    var dpr = Math.min(2, window.devicePixelRatio || 1), c = document.createElement("canvas"); c.width = Math.round(L * 1.25 * dpr); c.height = Math.round((alto || L * .7) * dpr);
    c.style.width = L * 1.25 + "px"; c.style.height = (alto || L * .7) + "px";
    var x = c.getContext("2d"); x.scale(dpr, dpr); x.translate(L * .62, (alto || L * .7) / 2); disegnaPesce(x, sp, L);
    return c;
  }

  // ---------- suoni (fatti al volo) ----------
  var AUDIO = null;
  var CHIAVE_SUONI = "sg-pe-suoni";   // i suoni del laghetto (anche gli uccellini e i grilli) si spengono col tasto 🔊
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
    // la gara (js/games/garapesca.js): canna e lombrichi uguali per tutti e senza limite, niente album né cesto, il tempo e la classifica in alto
    var GARA = opts.gara || null, gara = { fineAt: 0, righe: [], kg: 0, ultimo: 0, finita: false };
    var D = !GARA && opts.dati && opts.dati.v ? opts.dati : datiIniziali();
    if (GARA) opts.salva = null;
    D.album = D.album || {}; D.cesto = D.cesto || []; D.esche = D.esche || { g: oggi(), usate: 0 }; D.extra = D.extra || 0; D.tot = D.tot || 0;
    D.canne = D.canne || ["bambu"]; D.canna = D.canna || "bambu"; D.escheSp = D.escheSp || { colorata: 0, luminosa: 0 }; D.escaUso = ESCHE[D.escaUso] ? D.escaUso : "lombrico";
    function salva() { if (opts.salva) opts.salva(D); }
    function lombrichi() { if (D.esche.g !== oggi()) D.esche = { g: oggi(), usate: 0 }; return Math.max(0, ESCHE_GIORNO - D.esche.usate) + D.extra; }
    function eschePronte() {   // quante ne hai di quella che stai usando (finita una speciale, si torna ai lombrichi)
      if (GARA) return gara.finita ? 0 : 99;
      if (D.escaUso !== "lombrico" && !(D.escheSp[D.escaUso] > 0)) D.escaUso = "lombrico";
      return D.escaUso === "lombrico" ? lombrichi() : D.escheSp[D.escaUso];
    }
    function usaEsca() {
      if (GARA) return;
      if (D.escaUso !== "lombrico" && D.escheSp[D.escaUso] > 0) { D.escheSp[D.escaUso]--; if (!D.escheSp[D.escaUso]) dimmi("Finite le esche speciali: si torna ai lombrichi 🪱"); }
      else { lombrichi(); if (D.esche.usate < ESCHE_GIORNO) D.esche.usate++; else D.extra = Math.max(0, D.extra - 1); }
      salva(); aggTesta();
    }
    function laCanna() { return GARA ? CANNE[0] : canna(D.canna); }
    function monete() { return opts.monete ? opts.monete() : 0; }

    var s = el("div", "schermata pe-vista" + (GARA ? " pe-in-gara" : "")), cv = el("canvas", "pe-tela"), ctx = cv.getContext("2d");
    var testa = el("div", "pe-testa"), bInd = el("button", "pe-tasto", "‹"), nome = el("div", "pe-nome"), cEsche = el("div", "pe-chip"), cMonete = el("div", "pe-chip");
    bInd.setAttribute("aria-label", "Indietro"); bInd.onclick = function () { esci(); };
    var bSuoni = el("button", "pe-tasto", suoniOn() ? "🔊" : "🔇"); bSuoni.setAttribute("aria-label", "Suoni");
    bSuoni.onclick = function () { var on = !suoniOn(); try { localStorage.setItem(CHIAVE_SUONI, on ? "1" : "0"); } catch (e) {} bSuoni.textContent = on ? "🔊" : "🔇"; };
    [bInd, bSuoni, nome, cEsche, cMonete].forEach(function (n) { testa.appendChild(n); });
    var giu = el("div", "pe-giu"), bAlbum = el("button", "pe-bott", "📖 Album"), bCesto = el("button", "pe-bott"), bAttr = el("button", "pe-bott", "🎒 Attrezzi");
    bAlbum.onclick = function () { album(); }; bCesto.onclick = function () { cesto(); }; bAttr.onclick = function () { attrezzi(); };
    giu.appendChild(bAlbum); giu.appendChild(bCesto); giu.appendChild(bAttr);
    var aiuto = el("div", "pe-aiuto"), avviso = el("div", "pe-avviso"), sopra = el("div", "pe-sopra");
    var classi = GARA ? el("div", "pe-classi") : null;   // in gara: la classifica dal vivo
    var bGara = !GARA && opts.apriGara ? el("button", "pe-gara-b", "👥 Gara con gli amici") : null;   // la gara di pesca online parte da qui
    if (bGara) bGara.onclick = function () { if (st.fase !== "pronto") return dimmi("Finisci prima la pescata"); chiudi(); opts.apriGara(); };
    [cv, testa, GARA ? classi : giu, bGara, aiuto, avviso, sopra].forEach(function (n) { if (n) s.appendChild(n); });
    var FASE = fase();
    nome.textContent = GARA ? "⏱️ …" : "🎣 Laghetto " + (FASE === "notte" ? "🌙" : FASE === "tramonto" ? "🌅" : "☀️");
    function aggTesta() {
      if (GARA) { cEsche.textContent = "🏆 " + kg(gara.kg); cMonete.style.display = "none"; return; }
      var n = eschePronte(); cEsche.textContent = ESCHE[D.escaUso].ico + " " + n; cMonete.textContent = "🪙 " + cifre(monete());
      bCesto.textContent = "🧺 Cesto" + (D.cesto.length ? " (" + D.cesto.length + ")" : "");
    }
    function orologio() {   // in gara: quanto manca (si aggiorna solo quando cambia il secondo)
      var r = Math.max(0, Math.ceil((gara.fineAt - Date.now()) / 1000)), t = "⏱️ " + Math.floor(r / 60) + ":" + ("0" + r % 60).slice(-2);
      if (gara.fineAt && nome.textContent !== t) { nome.textContent = t; nome.classList.toggle("pe-poco", r <= 10); }
    }
    function disegnaClassi() {
      if (!classi) return;
      while (classi.firstChild) classi.removeChild(classi.firstChild);
      gara.righe.slice(0, 4).forEach(function (r, i) { classi.appendChild(el("div", "pe-cl" + (r.tu ? " tu" : ""), (i + 1) + ". " + (r.tu ? "Tu" : r.nome) + " · " + kg(r.kg))); });
    }
    function dimmi(t) { avviso.textContent = t; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    function suggerisci(t) { if (aiuto.textContent !== t) aiuto.textContent = t; aiuto.style.opacity = t ? "1" : "0"; }
    function vivo() { return document.body.contains(cv); }

    // ---- misure e telecamera: si disegna tutto in unità del lago, la telecamera si avvicina e trema ----
    var S = 3, ox = 0, oy = 0, cw = 360, ch = 640, dpr = 1, paesaggio = null, vignetta = null, figura = null;
    var R = { x0: -30, y0: -55, x1: 130, y1: 186 };   // il pezzo di mondo disegnato (più largo del lago: si vede anche ai lati)
    var cam = { z: 1, fx: 50, fy: 90, scossa: 0 };
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      cw = s.clientWidth || 360; ch = s.clientHeight || 640; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      S = Math.min(cw / W, ch / 165); ox = (cw - W * S) / 2; oy = ch - H * S;
      paesaggio = null; vignetta = null;
    }
    window.addEventListener("resize", misura);
    function mondo(c) {   // da qui si disegna in unità del lago, con la telecamera
      var z = cam.z, k = S * z, sh = cam.scossa > 0 ? cam.scossa : 0;
      var tx = ox + cam.fx * S * (1 - z) + (Math.random() - .5) * sh * S, ty = oy + cam.fy * S * (1 - z) + (Math.random() - .5) * sh * S;
      c.setTransform(dpr * k, 0, 0, dpr * k, dpr * tx, dpr * ty);
    }
    function schermo(c) { c.setTransform(dpr, 0, 0, dpr, 0, 0); }   // da qui si disegna in pixel dello schermo (la testa)
    function aSchermo(x, y) { return { x: ox + (cam.fx + (x - cam.fx) * cam.z) * S, y: oy + (cam.fy + (y - cam.fy) * cam.z) * S }; }
    // l'avatar sul pontile (un'immagine: si disegna una volta)
    if (opts.omino && window.SGOmino) try { figura = new Image(); figura.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(opts.omino)); } catch (e) { figura = null; }
    // l'avatar con le braccia che tengono la canna: un disegno ogni 5 gradi (fatti una volta sola) e dove sta il pugno
    var poseCanna = {};
    function posaCanna(th) {
      if (!opts.omino || !window.SGOmino || !SGOmino.mano) return null;
      var a = Math.max(30, Math.min(140, Math.round(th / 5) * 5));
      if (poseCanna[a]) return poseCanna[a];
      var p = { im: new Image(), mano: null };
      try { p.mano = SGOmino.mano(opts.omino, { braccia: "canna", angolo: a }); p.im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(opts.omino, { braccia: "canna", angolo: a })); } catch (e) { p = null; }
      return (poseCanna[a] = p);
    }
    function angoloBraccio() { var al = -(st.rodA == null ? -.95 : st.rodA) * 180 / Math.PI; return 60 + al * .7; }   // la canna più alta, il braccio più alto
    for (var aPosa = 30; aPosa <= 140; aPosa += 5) posaCanna(aPosa);   // pronti subito, così non scatta

    // ---- i colori di ogni ora (e un po' più grigi se piove) ----
    var PAL = {
      giorno:   { c0: "#2f86dc", c1: "#8fd0ff", c2: "#e4f5ff", lon: "#a8c4dc", mon: "#7fa8b0", col: "#6aab4f", col2: "#4f8e3c", alb: "#2f6b34", alb2: "#3e8a3f", a0: "#5ec2e8", a1: "#1b80ae", a2: "#082f4b", f0: "#dcc286", f1: "#b39257", f2: "#6e5432", luce: "255,250,220", nuvola: "255,255,255", astro: [83, 9] },
      tramonto: { c0: "#241b5c", c1: "#c4577a", c2: "#ffbf85", lon: "#b07a90", mon: "#7f5576", col: "#6e6a40", col2: "#575132", alb: "#3a3424", alb2: "#4a4430", a0: "#e69a74", a1: "#3d6b8a", a2: "#0d1f33", f0: "#ad895c", f1: "#866640", f2: "#4f3a24", luce: "255,205,160", nuvola: "255,190,170", astro: [66, 31] },
      notte:    { c0: "#02051a", c1: "#121c46", c2: "#2b3b74", lon: "#26355c", mon: "#1c2847", col: "#15213b", col2: "#101b31", alb: "#0b1424", alb2: "#0f1a2c", a0: "#1f4d80", a1: "#0d2648", a2: "#020812", f0: "#4d4434", f1: "#3b3528", f2: "#221e17", luce: "190,210,255", nuvola: "120,140,190", astro: [80, 11] }
    };
    var PIOVE = !GARA && Math.random() < .15;   // a volte piove: i pesci abboccano di più
    function pal() { return PAL[FASE] || PAL.giorno; }
    function mix(a, b, t) { var p = function (h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }, A = p(a), B = p(b); return "rgb(" + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(",") + ")"; }
    function grigio(c) { return PIOVE ? mix(c, "#6b7480", .35) : c; }

    // ---- il paesaggio fermo (montagne, colline, acqua, fondo, pontile): disegnato una volta sola, in unità del lago ----
    function disegnaPaesaggio() {
      var k = S * dpr, c = document.createElement("canvas"), P = pal(), r = rnd(4242), i, g, xx;
      c.width = Math.ceil((R.x1 - R.x0) * k); c.height = Math.ceil((R.y1 - R.y0) * k);
      var x = c.getContext("2d"); x.setTransform(k, 0, 0, k, -R.x0 * k, -R.y0 * k); x.lineJoin = "round"; x.lineCap = "round";
      function crinale(y0, amp, f1, f2, ph, col) { x.fillStyle = col; x.beginPath(); x.moveTo(R.x0, SUP + 1); for (xx = R.x0; xx <= R.x1; xx += 1.5) x.lineTo(xx, y0 - Math.abs(Math.sin(xx / f1 + ph)) * amp - Math.sin(xx / f2 + ph * 2) * amp * .35); x.lineTo(R.x1, SUP + 1); x.closePath(); x.fill(); }
      // le montagne lontane nella foschia, poi quelle medie
      crinale(44, 13, 17, 7, .4, grigio(P.lon));
      g = x.createLinearGradient(0, 28, 0, SUP); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, PIOVE ? "rgba(200,205,215,.55)" : "rgba(" + (FASE === "notte" ? "60,80,140" : "255,255,255") + ",.35)"); x.fillStyle = g; x.fillRect(R.x0, 28, R.x1 - R.x0, SUP - 28);
      crinale(51, 8, 11, 5, 2.1, grigio(P.mon));
      // le colline col bosco: alberi tondi e pini, più scuri in basso
      crinale(56, 4, 9, 4, 4.2, grigio(P.col));
      for (i = 0; i < 46; i++) {
        var tx = R.x0 + 4 + i * 3.6 + r() * 2, ty = 56 - Math.abs(Math.sin(tx / 9 + 4.2)) * 4 - Math.sin(tx / 4 + 8.4) * 1.4 + 1.2, hh = 2.6 + r() * 2.4;
        if (tx > -2 && tx < 26) continue;   // (dietro al pontile lasciamo l'aria)
        x.fillStyle = grigio(i % 3 ? P.alb : P.alb2);
        if (i % 4 === 0) { x.beginPath(); x.moveTo(tx - 1.4, ty); x.lineTo(tx, ty - hh * 1.5); x.lineTo(tx + 1.4, ty); x.closePath(); x.fill(); }
        else { x.beginPath(); x.arc(tx, ty - hh * .6, hh * .6, 0, 7); x.fill(); x.beginPath(); x.arc(tx + hh * .5, ty - hh * .35, hh * .45, 0, 7); x.fill(); }
      }
      crinale(59.4, 1.2, 6, 3, 1.3, grigio(P.col2));
      // l'acqua: chiara in alto, buia in fondo
      g = x.createLinearGradient(0, SUP, 0, R.y1); g.addColorStop(0, grigio(P.a0)); g.addColorStop(.32, grigio(P.a1)); g.addColorStop(1, grigio(P.a2));
      x.fillStyle = g; x.fillRect(R.x0, SUP, R.x1 - R.x0, R.y1 - SUP);
      // il fondo: sabbia a strati, più scura dove è profondo, con le increspature
      g = x.createLinearGradient(0, 78, 0, 170); g.addColorStop(0, P.f0); g.addColorStop(.45, P.f1); g.addColorStop(1, P.f2);
      x.fillStyle = g; x.beginPath(); x.moveTo(R.x0, R.y1); x.lineTo(R.x0, yFondo(0));
      for (xx = R.x0; xx <= R.x1; xx += 1) x.lineTo(xx, yFondo(Math.max(0, xx)) + Math.sin(xx * 1.3) * .35);
      x.lineTo(R.x1, R.y1); x.closePath(); x.fill();
      x.strokeStyle = "rgba(255,255,255,.12)"; x.lineWidth = .25;
      for (i = 0; i < 40; i++) { var sx = 18 + r() * 86, sy = yFondo(sx) + 1 + r() * 6; x.beginPath(); x.moveTo(sx - 1.6, sy); x.quadraticCurveTo(sx, sy - .5, sx + 1.6, sy); x.stroke(); }
      x.fillStyle = "rgba(0,0,0,.1)"; for (i = 0; i < 120; i++) { var gx = 16 + r() * 90, gy = yFondo(gx) + .6 + r() * 16; x.fillRect(gx, gy, .25, .25); }
      // i sassi (con la luce sopra), le conchiglie, un tronco e un'anfora affondati
      for (i = 0; i < 16; i++) {
        var px = 20 + r() * 82, py = yFondo(px) + .2, rw = .9 + r() * 1.8, rh = rw * (.5 + r() * .25), sg = x.createLinearGradient(0, py - rh, 0, py + rh);
        sg.addColorStop(0, FASE === "notte" ? "#5a5f6a" : "#b9bec4"); sg.addColorStop(1, FASE === "notte" ? "#2a2e36" : "#6d737c");
        x.fillStyle = sg; x.beginPath(); x.ellipse(px, py, rw, rh, (r() - .5) * .3, 0, 7); x.fill();
        x.fillStyle = "rgba(60,120,60,.35)"; x.beginPath(); x.ellipse(px - rw * .3, py - rh * .5, rw * .4, rh * .25, 0, 0, 7); x.fill();   // un po' di muschio
      }
      [[34, 1], [61, -1], [88, 1]].forEach(function (q) { var py = yFondo(q[0]) + .3; x.fillStyle = FASE === "notte" ? "#8a7f75" : "#f8e1d0"; x.beginPath(); x.moveTo(q[0] - .9, py); x.quadraticCurveTo(q[0], py - 1.6, q[0] + .9, py); x.closePath(); x.fill(); x.strokeStyle = "rgba(160,110,90,.6)"; x.lineWidth = .12; for (var j = -2; j <= 2; j++) { x.beginPath(); x.moveTo(q[0], py); x.lineTo(q[0] + j * .35, py - 1.2); x.stroke(); } });
      var lx = 52, ly = yFondo(lx) - .6;   // il tronco
      x.save(); x.translate(lx, ly); x.rotate(.62); x.fillStyle = FASE === "notte" ? "#3a2c1f" : "#6b4a2c"; x.fillRect(-7, -1.1, 14, 2.2); x.fillStyle = FASE === "notte" ? "#2a2016" : "#4e3520"; x.beginPath(); x.ellipse(7, 0, .6, 1.1, 0, 0, 7); x.fill(); x.strokeStyle = "rgba(0,0,0,.25)"; x.lineWidth = .15; for (i = -6; i < 6; i += 2.5) { x.beginPath(); x.moveTo(i, -.9); x.lineTo(i + 1.2, -.2); x.stroke(); } x.restore();
      var ax = 76, ay = yFondo(ax) - 1.2;   // l'anfora (un pezzo d'Italia anche sott'acqua)
      x.save(); x.translate(ax, ay); x.rotate(-1.15); x.fillStyle = FASE === "notte" ? "#5a3a2a" : "#b5623a";
      x.beginPath(); x.moveTo(-.6, -3.2); x.quadraticCurveTo(-1.8, -1.5, -1.6, .8); x.quadraticCurveTo(-1, 2.6, 0, 2.8); x.quadraticCurveTo(1, 2.6, 1.6, .8); x.quadraticCurveTo(1.8, -1.5, .6, -3.2); x.closePath(); x.fill();
      x.strokeStyle = x.fillStyle; x.lineWidth = .35; x.beginPath(); x.moveTo(-.6, -2.6); x.quadraticCurveTo(-1.8, -2.8, -1.3, -1.3); x.moveTo(.6, -2.6); x.quadraticCurveTo(1.8, -2.8, 1.3, -1.3); x.stroke();
      x.fillStyle = "rgba(255,255,255,.18)"; x.beginPath(); x.ellipse(-.6, 0, .35, 1.4, 0, 0, 7); x.fill(); x.restore();
      // tutto quello che sta sott'acqua prende il colore dell'acqua, sempre più buio in profondità
      function rgba(h, a) { var n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
      g = x.createLinearGradient(0, SUP, 0, R.y1); g.addColorStop(0, rgba(P.a0, 0)); g.addColorStop(.18, rgba(P.a1, .3)); g.addColorStop(.6, rgba(P.a1, .45)); g.addColorStop(1, rgba(P.a2, .78));
      x.fillStyle = g; x.fillRect(R.x0, SUP, R.x1 - R.x0, R.y1 - SUP);
      // il pontile: i pali nell'acqua (con le alghe attaccate), le assi, la cassetta, la corda e il palo della lanterna
      var legno = FASE === "notte" ? "#4a3624" : "#a8692e", scuro = FASE === "notte" ? "#2a1e14" : "#6b4220";
      [3, 11, 19].forEach(function (px2) {
        var pg = x.createLinearGradient(px2 - .8, 0, px2 + .8, 0); pg.addColorStop(0, scuro); pg.addColorStop(.5, legno); pg.addColorStop(1, scuro);
        x.fillStyle = pg; x.fillRect(px2 - .8, SUP - 5, 1.6, yFondo(px2) - SUP + 6);
        x.fillStyle = "rgba(47,110,60,.55)"; x.fillRect(px2 - .85, SUP + .5, 1.7, 2.4);   // le alghe sul palo
      });
      x.fillStyle = scuro; x.fillRect(-12, SUP - 5.2, PONTE + 12, 1.6);
      for (var ab = -12; ab < PONTE; ab += 2.4) { var lg = x.createLinearGradient(0, SUP - 7.4, 0, SUP - 5.2); lg.addColorStop(0, mix(legno, "#ffffff", .18)); lg.addColorStop(1, legno); x.fillStyle = lg; x.fillRect(ab + .08, SUP - 7.4, 2.24, 2.2); }
      x.fillStyle = scuro; x.fillRect(PONTE - 1.2, SUP - 17, 1, 10);   // il palo della lanterna
      x.fillRect(PONTE - 1.2, SUP - 17, 3.2, .7);
      x.fillStyle = FASE === "notte" ? "#3a4a6a" : "#2b8a3e"; x.fillRect(1.5, SUP - 9.6, 4.4, 2.2); x.fillStyle = "rgba(255,255,255,.25)"; x.fillRect(1.5, SUP - 9.6, 4.4, .5);   // la cassetta degli attrezzi
      x.strokeStyle = FASE === "notte" ? "#6a5a40" : "#d9c08a"; x.lineWidth = .35; for (i = 0; i < 3; i++) { x.beginPath(); x.ellipse(-4, SUP - 7.8, 1.6 - i * .4, .5 - i * .1, 0, 0, 7); x.stroke(); }   // la corda arrotolata
      paesaggio = c;
    }
    function disegnaVignetta() {   // i bordi un po' più scuri: l'occhio va al centro
      var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; var x = c.getContext("2d");
      var g = x.createRadialGradient(cv.width / 2, cv.height * .48, Math.min(cv.width, cv.height) * .35, cv.width / 2, cv.height * .48, Math.max(cv.width, cv.height) * .75);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0," + (FASE === "notte" ? .45 : .28) + ")"); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
      vignetta = c;
    }

    // =========================================================
    //  LO STATO DELLA PESCA
    // =========================================================
    var st = { fase: "pronto", t: 0, carica: 0, caricaDir: 1, hx: 0, hy: 0, gal: { x: 0, y: 0, dip: 0 }, volo: null, attesa: 0, cerca: 0, pesce: null, lotta: null, salto: null, punta: 0 };
    var pesci = [], fx = [], lucciole = [];
    function nuovoPesce(daFuori, vicinoA, pesi) {   // vicinoA: un pesce adatto a quel punto del lago, che arriva lì vicino; pesi: le rarità dell'esca speciale
      var cur = null, sp = null, fv = vicinoA != null ? fracDi(vicinoA) : null;
      pesi = pesi || PESO_R;
      if (!GARA && Math.random() < (pesi === PESO_R ? .07 : .02)) { var tot = 0; CURIOSITA.forEach(function (q) { tot += q.peso; }); var r = Math.random() * tot; for (var i = 0; i < CURIOSITA.length; i++) { r -= CURIOSITA[i].peso; if (r <= 0) { cur = CURIOSITA[i]; break; } } }
      if (!cur) {
        var ok = PESCI.filter(function (p) { return adesso(p, FASE) && (fv == null || (fv >= p.dove[0] - .08 && fv <= p.dove[1] + .08)); }), totp = 0;
        if (!ok.length) ok = PESCI.filter(function (p) { return p.r === 1 && p.quando === "sempre"; });
        ok.forEach(function (p) { totp += pesi[p.r]; });
        var rr = Math.random() * totp; for (var j = 0; j < ok.length; j++) { rr -= pesi[ok[j].r]; if (rr <= 0) { sp = ok[j]; break; } }
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
        if (GARA && gara.finita) { premuto = false; return; }
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
      st.fase = "volo"; var pt0 = geo().punta; st.volo = { t: 0, dur: .55 + p * .45, x0: pt0.x, y0: pt0.y, x1: tx, y1: SUP };
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
      var scelto = null, spec = D.escaUso !== "lombrico" && D.escheSp[D.escaUso] > 0 ? ESCHE[D.escaUso].pesi : null;   // l'esca speciale richiama i pesci rari dal fondo
      if (vicini.length && Math.random() < (PIOVE ? .65 : .45) && !(spec && Math.random() < .75)) scelto = vicini[Math.floor(Math.random() * vicini.length)];
      else if (st.attesa > (spec || PIOVE ? 1.5 : 2.5) + Math.random() * 1.5) {   // nessuno si è accorto: ne arriva uno dal buio lì vicino (non si aspetta troppo)
        scelto = nuovoPesce(false, st.hx, spec);
        if (pesci.length >= 9) { var lontano = pesci.filter(function (p) { return p.stato === "gira"; }).sort(function (a, b) { return Math.abs(b.x - st.hx) - Math.abs(a.x - st.hx); })[0]; pesci = pesci.filter(function (p) { return p !== lontano; }); }   // (non troppi pesci nel lago)
        pesci.push(scelto);
      }
      if (scelto) { scelto.stato = "va"; scelto.assaggi = 1 + Math.floor(Math.random() * (scelto.sp && scelto.sp.r >= 3 ? 4 : 3)); scelto.tAss = 0; st.pesce = scelto; }
    }
    function ferra() {   // il tocco durante l'attesa
      var p = st.pesce;
      if (p && p.stato === "abbocca") {   // preso all'amo!
        p.stato = "amo"; usaEsca(); vibra(20); suonoAbbocca(); cam.scossa = .5;
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
        L.d -= .3 / (.7 + .25 * f) * laCanna().tira * dt;   // i pesci forti si tirano su più piano (le canne buone tirano più svelte)
        L.tens += (.14 * f * fatica + (L.strappo ? .6 * f : 0)) * laCanna().tens * dt;   // (le canne buone reggono di più)
        L.mul -= dt; if (L.mul <= 0) { L.mul = .08; suonoMulinello(); }
      } else {
        L.tens -= 1.0 * dt;
        L.d += (.015 * f + (L.strappo ? .05 * f : 0)) * dt;
      }
      L.tens = Math.max(0, L.tens);
      if (L.tens >= 1 || L.d >= 1.3) {   // il filo si spezza, o il pesce si slaccia: scappa da dov'è
        var q = posPesce(); st.pesce.x = q.x; st.pesce.y = q.y; st.pesce.stato = "fugge";
        if (L.tens >= 1) { suonoSpezza(); cam.scossa = .9; dimmi("Il filo si è spezzato! 💥"); } else dimmi("Si è slacciato ed è scappato… 🐟💨");
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
      st.fase = "salto"; st.salto = { t: 0, x0: q.x, y0: q.y, p: p }; premuto = false; suggerisci("");
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
      svuota(); st.fase = "carta"; suggerisci(""); st.festa = p.sp && p.sp.r >= 2 ? 1.4 : .6;
      var box = el("div", "pe-carta pe-presa" + (p.sp ? " r" + p.sp.r : "")), sp = p.sp, cur = p.cur;   // (la carta si gira; quelle rare hanno i raggi dietro)
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
    function garaPreso(p) {   // in gara: niente carta, il pesce va in classifica e si ripesca subito
      st.fase = "carta"; st.festa = .6;
      if (p.sp && !gara.finita) {
        var w = pesoKg(p.sp, p.cm); gara.kg += w;
        dimmi("+" + kg(w) + " · " + p.sp.nome + " " + p.cm + " cm" + (p.sp.r >= 3 ? " 🤩" : " 🎉")); suonoPreso(p.sp.r); vibra(12);
        if (GARA.onPreso) GARA.onPreso({ id: p.sp.id, cm: p.cm, kg: w, r: p.sp.r });
      }
      aggTesta(); fine(true);
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
      var ok = monete() >= PACCO.prezzo, altre = ORDINE_ESCHE.filter(function (k) { return k !== "lombrico" && D.escheSp[k] > 0; });
      finestra("Esche finite 🪱", [el("p", "pe-frase", "I 10 lombrichi gratis tornano domani a mezzanotte." + (altre.length ? " Hai ancora delle esche speciali negli attrezzi." : " Intanto puoi comprarne altri."))],
        [{ testo: "Compra " + PACCO.n + " lombrichi · 🪙 " + cifre(PACCO.prezzo), cls: "btn-primario", off: !ok, fn: function () { if (monete() < PACCO.prezzo) return; if (opts.cambia) opts.cambia(-PACCO.prezzo); D.extra += PACCO.n; salva(); suonoMonete(); vibra(10); chiudiSopra(); aggTesta(); suggerisci("Tieni premuto per caricare il lancio, poi lascia"); } },
          { testo: "🎒 Attrezzi", fn: attrezzi }, { testo: "Va bene", fn: chiudiSopra }]);
    }
    // ---- gli attrezzi: le canne (le compri una volta) e le esche (a pacchetti da 5), con quella che stai usando ----
    function attrezzi() {
      if (st.fase !== "pronto" && st.fase !== "carta") return dimmi("Finisci prima la pescata");
      var lc = el("div", "pe-attr");
      CANNE.forEach(function (c) {
        var tua = D.canne.indexOf(c.id) >= 0, inUso = D.canna === c.id, r = el("div", "pe-oggetto" + (inUso ? " uso" : ""));
        var seg = el("i", "pe-canna"); seg.style.background = c.col; r.appendChild(seg);
        var t = el("div", "pe-testo"); t.appendChild(el("b", null, c.nome)); t.appendChild(el("small", null, c.sotto)); r.appendChild(t);
        var b = el("button", "pe-vendi", inUso ? "In uso" : tua ? "Usa" : "🪙 " + cifre(c.prezzo));
        b.disabled = inUso || (!tua && monete() < c.prezzo);
        b.onclick = function () {
          if (!tua) { if (monete() < c.prezzo) return; if (opts.cambia) opts.cambia(-c.prezzo); D.canne.push(c.id); suonoMonete(); dimmi("Nuova canna! 🎣"); }
          D.canna = c.id; vibra(8); salva(); aggTesta(); attrezzi();
        };
        r.appendChild(b); lc.appendChild(r);
      });
      var le = el("div", "pe-attr");
      ORDINE_ESCHE.forEach(function (k) {
        var E = ESCHE[k], n = k === "lombrico" ? lombrichi() : (D.escheSp[k] || 0), inUso = D.escaUso === k, r = el("div", "pe-oggetto" + (inUso ? " uso" : ""));
        r.appendChild(el("i", "pe-esca", E.ico));
        var t = el("div", "pe-testo"); t.appendChild(el("b", null, E.nome + " · ne hai " + n)); t.appendChild(el("small", null, E.sotto)); r.appendChild(t);
        var col = el("div", "pe-due");
        var bc = el("button", "pe-vendi", "+5 · 🪙 " + cifre(E.prezzo)); bc.disabled = monete() < E.prezzo;
        bc.onclick = function () {
          if (monete() < E.prezzo) return; if (opts.cambia) opts.cambia(-E.prezzo);
          if (k === "lombrico") D.extra += 5; else { D.escheSp[k] = (D.escheSp[k] || 0) + 5; D.escaUso = k; }
          suonoMonete(); vibra(8); salva(); aggTesta(); attrezzi();
        };
        col.appendChild(bc);
        if (!inUso && n > 0) { var bu = el("button", "pe-usa", "Usa"); bu.onclick = function () { D.escaUso = k; vibra(8); salva(); aggTesta(); attrezzi(); }; col.appendChild(bu); }
        else if (inUso) col.appendChild(el("span", "pe-inuso", "In uso"));
        r.appendChild(col); le.appendChild(r);
      });
      finestra("🎒 Attrezzi", [el("div", "pe-sottot", "Le canne"), lc, el("div", "pe-sottot", "Le esche"), le, el("p", "pe-nota", "🪙 " + cifre(monete()) + " · un'esca si usa solo quando un pesce abbocca")],
        [{ testo: "Chiudi", cls: "btn-primario", fn: function () { chiudiSopra(); suggerisci(eschePronte() > 0 ? "Tieni premuto per caricare il lancio, poi lascia" : "Esche finite: le trovi negli attrezzi"); } }]);
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
      finestra("🧺 Il cesto · " + D.cesto.length + "/" + CESTO_MAX, [lista, el("p", "pe-nota", "Li puoi mettere in un acquario di casa: lo trovi nel negozio, tra le decorazioni.")],
        [{ testo: "Vendi tutto · 🪙 " + cifre(tot), cls: "btn-primario", off: !D.cesto.length, fn: function () { if (opts.cambia) opts.cambia(tot); D.cesto = []; suonoMonete(); vibra(10); salva(); aggTesta(); chiudiSopra(); } },
          { testo: "Chiudi", fn: chiudiSopra }]);
    }
    function esci() {
      if (GARA) return opts.indietro && opts.indietro();   // (in gara decide il gioco: chiede prima)
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
      aggiorna(st.fase === "salto" && st.salto.t < .55 ? dt * .45 : dt); disegna();   // (il salto del pesce al rallentatore)
      anim = requestAnimationFrame(giro);
    }
    function aggiorna(dt) {
      st.t += dt;
      ambiente(dt);
      if (st.fase === "carica") { st.carica += st.caricaDir * dt / .9; if (st.carica >= 1) { st.carica = 1; st.caricaDir = -1; } if (st.carica <= 0) { st.carica = 0; st.caricaDir = 1; } }
      if (st.fase === "volo") { st.volo.t += dt; if (st.volo.t >= st.volo.dur) inAcqua(); }
      if (st.fase === "attesa") { st.attesa += dt; cercaPesce(dt); }
      if (st.fase === "lotta") lotta(dt);
      if (st.fase === "salto") { st.salto.t += dt; if (st.salto.t >= .75) { if (GARA) garaPreso(st.salto.p); else carta(st.salto.p); } }
      if (GARA) orologio();
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
            else { p.stato = "abbocca"; p.tAbb = p.tAbb0 = (p.sp && p.sp.r >= 3 ? .45 : .62) + laCanna().fin; st.gal.dip = 1; suonoAbbocca(); goccia(st.gal.x, SUP, 6); onda(st.gal.x, SUP); }
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

    // =========================================================
    //  LA SCENA CHE SI MUOVE: cielo, acqua, fondale, il pescatore, la telecamera
    // =========================================================
    var amb = { nuvole: [], stelle: [], uccelli: null, tUcc: 3 + Math.random() * 5, cadente: null, tCad: 6, pulv: [], banchi: [], alghe: [], davanti: [], pioggia: [], tSalto: 5 + Math.random() * 6, tCanto: 1.5 };
    (function () {
      var r = rnd(77), i;
      for (i = 0; i < 6; i++) amb.nuvole.push({ x: R.x0 + i * 30 + r() * 12, y: -38 + r() * 52, s: .7 + r() * .8, v: .5 + r() * .9 });
      for (i = 0; i < 95; i++) amb.stelle.push({ x: R.x0 + r() * (R.x1 - R.x0), y: R.y0 + r() * (SUP - 12 - R.y0), s: .12 + r() * .3, f: r() * 6, v: .8 + r() * 2.2 });
      for (i = 0; i < 46; i++) { var px = 4 + r() * 98; amb.pulv.push({ x: px, y: SUP + 3 + r() * (yFondo(px) - SUP - 4), v: (r() - .5) * .8, f: r() * 6, a: .12 + r() * .22, s: .12 + r() * .18 }); }
      for (i = 0; i < 2; i++) amb.banchi.push({ x: r() * 100, y: SUP + 12 + r() * 36, vx: (r() < .5 ? -1 : 1) * (4 + r() * 3), n: 5 + Math.floor(r() * 3), f: r() * 6 });
      for (i = 0; i < 13; i++) { var ax = 21 + i * 6.4 + r() * 3; amb.alghe.push({ x: ax, b: yFondo(ax) + .6, h: 6 + r() * 11, f: r() * 6, w: .9 + r() * .5, c: i % 3 }); }
      for (i = 0; i < 3; i++) amb.davanti.push({ x: 1 + i * 4.5 + r() * 2, h: 26 + r() * 16, f: r() * 6 });
      if (PIOVE) for (i = 0; i < 80; i++) amb.pioggia.push({ x: R.x0 + r() * (R.x1 - R.x0), y: R.y0 + r() * (SUP - R.y0), v: 70 + r() * 30 });
    })();
    function ambiente(dt) {
      amb.nuvole.forEach(function (n) { n.x += n.v * dt * (PIOVE ? 2 : 1); if (n.x > R.x1 + 14) { n.x = R.x0 - 14; } });
      if (FASE !== "notte" && !PIOVE) {   // ogni tanto passano gli uccelli
        if (amb.uccelli) { amb.uccelli.x += amb.uccelli.vx * dt; if (amb.uccelli.x > R.x1 + 10) amb.uccelli = null; }
        else if ((amb.tUcc -= dt) <= 0) { amb.tUcc = 9 + Math.random() * 12; amb.uccelli = { x: R.x0, y: -24 + Math.random() * 34, vx: 8 + Math.random() * 5, n: 3 + Math.floor(Math.random() * 3) }; }
      }
      if (FASE === "notte" && !PIOVE) {   // e di notte le stelle cadenti
        if (amb.cadente) { amb.cadente.t += dt; if (amb.cadente.t > .9) amb.cadente = null; }
        else if ((amb.tCad -= dt) <= 0) { amb.tCad = 10 + Math.random() * 14; amb.cadente = { x: 10 + Math.random() * 70, y: -45 + Math.random() * 30, t: 0 }; }
      }
      amb.pulv.forEach(function (p) { p.x += (p.v + Math.sin(st.t * .5 + p.f) * .25) * dt; if (p.x < 2) p.x = 100; if (p.x > 101) p.x = 3; });
      amb.banchi.forEach(function (b) { b.x += b.vx * dt; if (b.x < -14 || b.x > 114) { b.vx = -b.vx; b.y = SUP + 12 + Math.random() * 36; } });
      amb.pioggia.forEach(function (g) { g.y += g.v * dt; g.x -= g.v * .18 * dt; if (g.y > SUP) { if (Math.random() < .35 && g.x > PONTE) onda(g.x, SUP); g.y = R.y0 + Math.random() * 20; g.x = R.x0 + Math.random() * (R.x1 - R.x0 + 20); } });
      if ((amb.tSalto -= dt) <= 0) {   // un pesciolino che salta fuori dall'acqua, laggiù
        amb.tSalto = 7 + Math.random() * 9; var jx = 40 + Math.random() * 55;
        fx.push({ t: "salta", x: jx, y: SUP, vita: .7, d: Math.random() < .5 ? -1 : 1 }); onda(jx, SUP); tono(900, 0, .08, "sine", .025, 300);
      }
      if ((amb.tCanto -= dt) <= 0) {   // gli uccellini di giorno, i grilli di notte (piano piano)
        if (FASE === "notte") { amb.tCanto = .9 + Math.random() * .9; for (var k = 0; k < 3; k++) tono(4300, k * .06, .025, "triangle", .01); }
        else if (!PIOVE) { amb.tCanto = 2.5 + Math.random() * 5; var f0 = 2500 + Math.random() * 700; tono(f0, 0, .07, "sine", .02, f0 + 800); tono(f0 + 300, .1, .06, "sine", .016, f0 - 300); }
        else amb.tCanto = 3;
      }
      // la telecamera: si avvicina mentre aspetti e mentre lotti, poi torna indietro
      var tz = 1, tfx = 50, tfy = 90;
      if (st.fase === "volo") { tz = 1.04; tfx = 50 + (st.volo.x1 - 50) * .25; tfy = 84; }
      else if (st.fase === "attesa") { tz = 1.13; tfx = Math.max(30, Math.min(70, (14 + st.hx) / 2 + 4)); tfy = (SUP - 18 + st.hy) / 2; }
      else if (st.fase === "lotta") { var q = posPesce(); tz = 1.18; tfx = Math.max(30, Math.min(70, (14 + q.x) / 2 + 3)); tfy = (SUP - 16 + q.y) / 2; }
      else if (st.fase === "salto") { tz = 1.12; tfx = 32; tfy = SUP - 8; }
      var kc = Math.min(1, dt * 1.8); cam.z += (tz - cam.z) * kc; cam.fx += (tfx - cam.fx) * kc; cam.fy += (tfy - cam.fy) * kc;
      cam.scossa = Math.max(0, cam.scossa - dt * 3);
      // la posa del pescatore: si piega indietro caricando, scatta avanti lanciando, tira all'indietro nella lotta
      var tl = 0, ta = -.95;
      if (st.fase === "carica") { tl = -.18 * st.carica; ta = -.95 - 1.15 * st.carica; }
      else if (st.fase === "volo") { var kv = Math.min(1, st.volo.t / .3); tl = .1 * (1 - kv); ta = -.45 - .5 * kv; }
      else if (st.fase === "lotta") { tl = -.05 - .09 * st.lotta.tens + (st.lotta.strappo ? Math.sin(st.t * 40) * .025 : 0); ta = -1.2 - .25 * st.lotta.tens; }
      else if (st.fase === "salto") { tl = -.12; ta = -1.35; }
      var kp = Math.min(1, dt * (st.fase === "volo" ? 16 : 7));
      st.lean = (st.lean || 0) + (tl - (st.lean || 0)) * kp; st.rodA = (st.rodA == null ? -.95 : st.rodA) + (ta - (st.rodA == null ? -.95 : st.rodA)) * kp;
      if (st.festa > 0) st.festa -= dt;
    }
    function geo() {   // dove sono i piedi, la mano e la punta della canna (e quanto si piega)
      var Fx = 12, Fy = SUP - 6.6 - (st.festa > 0 ? Math.abs(Math.sin(st.t * 10)) * 1.4 : 0), a = st.lean || 0, ca = Math.cos(a), sa = Math.sin(a), hx = 2.7, hy = -9.4;
      var pc = posaCanna(angoloBraccio()), fw0 = 16, fh0 = fw0 * 1.32;
      if (pc && pc.mano) { hx = (pc.mano.x / 200 - .5) * fw0; hy = pc.mano.y / 264 * fh0 - fh0 * .96 + .6; }   // la canna parte dal pugno dell'avatar
      var mano = { x: Fx + hx * ca - hy * sa, y: Fy + hx * sa + hy * ca }, A = st.rodA == null ? -.95 : st.rodA, L = 21;
      var bend = st.fase === "lotta" ? 2.2 + 4 * Math.min(1, st.lotta.tens) + (st.lotta.strappo ? 1.6 : 0) : st.fase === "carica" ? -1.4 * st.carica : .5;
      var tx = mano.x + Math.cos(A) * L, ty = mano.y + Math.sin(A) * L + bend * .55;
      var mx = (mano.x + tx) / 2, my = (mano.y + ty) / 2, nx = -Math.sin(A), ny = Math.cos(A);
      return { piedi: { x: Fx, y: Fy }, mano: mano, punta: { x: tx, y: ty }, ctrl: { x: mx + nx * bend * .55, y: my + ny * bend * .55 } };
    }

    // ---- il disegno ----
    function disegna() {
      if (!paesaggio) disegnaPaesaggio();
      if (!vignetta) disegnaVignetta();
      var P = pal(), notte = FASE === "notte", t = st.t, i;
      schermo(ctx); ctx.fillStyle = grigio(P.a2); ctx.fillRect(0, 0, cw, ch);   // (ai lati, sui telefoni larghi)
      mondo(ctx); ctx.lineCap = "round"; ctx.lineJoin = "round";
      // il cielo
      var g = ctx.createLinearGradient(0, R.y0, 0, SUP); g.addColorStop(0, grigio(P.c0)); g.addColorStop(.55, grigio(P.c1)); g.addColorStop(1, grigio(P.c2));
      ctx.fillStyle = g; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, SUP - R.y0 + .5);
      if (notte && !PIOVE) amb.stelle.forEach(function (s2) { var a = .35 + .65 * Math.abs(Math.sin(t * s2.v + s2.f)); ctx.globalAlpha = a; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(s2.x, s2.y, s2.s, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      if (!PIOVE) {   // il sole, il tramonto o la luna, con l'alone
        var ax = P.astro[0], ay = P.astro[1], ga = ctx.createRadialGradient(ax, ay, 0, ax, ay, FASE === "tramonto" ? 42 : 24);
        ga.addColorStop(0, "rgba(" + P.luce + ",.85)"); ga.addColorStop(.25, "rgba(" + P.luce + ",.35)"); ga.addColorStop(1, "rgba(" + P.luce + ",0)");
        ctx.fillStyle = ga; ctx.fillRect(ax - 44, ay - 44, 88, 88);
        if (notte) { ctx.fillStyle = "#eef1f6"; ctx.beginPath(); ctx.arc(ax, ay, 4.6, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(160,170,190,.55)"; [[-1.4, -1, .9], [1.2, .8, .7], [.3, -2, .5], [-.6, 1.8, .6]].forEach(function (c) { ctx.beginPath(); ctx.arc(ax + c[0], ay + c[1], c[2], 0, 7); ctx.fill(); }); }
        else { ctx.fillStyle = FASE === "tramonto" ? "#ffcf6b" : "#fff6c4"; ctx.beginPath(); ctx.arc(ax, ay, FASE === "tramonto" ? 8.5 : 5.2, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(ax - 1.2, ay - 1.2, FASE === "tramonto" ? 4 : 2.4, 0, 7); ctx.fill(); }
      }
      if (amb.cadente) { var cs = amb.cadente, k = cs.t / .9, sx = cs.x + k * 26, sy = cs.y + k * 12, gc = ctx.createLinearGradient(sx - 9, sy - 4, sx, sy); gc.addColorStop(0, "rgba(255,255,255,0)"); gc.addColorStop(1, "rgba(255,255,255," + (1 - k) + ")"); ctx.strokeStyle = gc; ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(sx - 9, sy - 4); ctx.lineTo(sx, sy); ctx.stroke(); }
      if (PIOVE) { ctx.fillStyle = "rgba(70,78,92,.35)"; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, SUP - R.y0); }
      // le nuvole che scorrono
      amb.nuvole.forEach(function (n) {
        var a = notte ? .22 : FASE === "tramonto" ? .6 : .85; if (PIOVE) a = .9;
        var col = PIOVE ? "120,128,140" : P.nuvola;
        [[0, 0, 4], [4, -1.6, 3.4], [-4, -.8, 3], [7.6, .6, 2.6], [-7, .8, 2.2], [2, 1.4, 3.2]].forEach(function (c, j) {
          ctx.fillStyle = "rgba(" + col + "," + a + ")"; ctx.beginPath(); ctx.arc(n.x + c[0] * n.s, n.y + c[1] * n.s, c[2] * n.s, 0, 7); ctx.fill();
        });
        ctx.fillStyle = "rgba(" + (notte ? "10,15,40" : PIOVE ? "60,66,78" : "120,140,170") + "," + a * .22 + ")"; ctx.beginPath(); ctx.ellipse(n.x, n.y + 2.4 * n.s, 8.5 * n.s, 1.6 * n.s, 0, 0, 7); ctx.fill();   // la pancia più scura
      });
      if (amb.uccelli) { var u = amb.uccelli; ctx.strokeStyle = notte ? "#9aa" : "rgba(30,35,45,.8)"; ctx.lineWidth = .3; for (i = 0; i < u.n; i++) { var bx = u.x - i * 3.2, by = u.y + (i % 2) * 1.6 + i * .5, fl = Math.sin(t * 11 + i) * .9; ctx.beginPath(); ctx.moveTo(bx - 1.3, by - fl); ctx.quadraticCurveTo(bx - .6, by - .4, bx, by); ctx.quadraticCurveTo(bx + .6, by - .4, bx + 1.3, by - fl); ctx.stroke(); } }
      // il paesaggio fermo (montagne, colline, acqua, fondo, pontile)
      ctx.drawImage(paesaggio, R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
      // sott'acqua: i raggi di luce che oscillano
      if (!PIOVE) for (i = 0; i < 5; i++) {
        var rx = 24 + i * 16 + Math.sin(t * .22 + i * 1.3) * 3, lg = ctx.createLinearGradient(0, SUP, 0, SUP + 72), al = notte ? (i === 3 ? .07 : 0) : FASE === "tramonto" ? .09 : .14;
        if (!al) continue;
        lg.addColorStop(0, "rgba(" + P.luce + "," + al + ")"); lg.addColorStop(1, "rgba(" + P.luce + ",0)");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(rx - 1.8, SUP); ctx.lineTo(rx + 2.4, SUP); ctx.lineTo(rx + 15, SUP + 72); ctx.lineTo(rx + 6, SUP + 72); ctx.closePath(); ctx.fill();
      }
      // i riflessi di luce che danzano sul fondo
      if (!notte) { ctx.lineWidth = .18; for (i = 0; i < 28; i++) { var cx = 20 + i * 3 + Math.sin(t * .9 + i * 1.7) * 1.3, cy = yFondo(cx) + .15, ca = .14 + .12 * Math.sin(t * 1.6 + i); ctx.strokeStyle = "rgba(" + P.luce + "," + Math.max(0, ca) * (PIOVE ? .4 : 1) + ")"; ctx.beginPath(); ctx.moveTo(cx - .9, cy); ctx.quadraticCurveTo(cx, cy - .45 - Math.sin(t + i) * .2, cx + .9, cy); ctx.stroke(); } }
      // il pulviscolo che fluttua
      amb.pulv.forEach(function (p) { ctx.globalAlpha = p.a * (.6 + .4 * Math.sin(t + p.f)); ctx.fillStyle = notte ? "#9fc3ff" : "#ffffff"; ctx.beginPath(); ctx.arc(p.x, p.y + Math.sin(t * .7 + p.f) * .5, p.s, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      // i banchi di pesciolini di passaggio (si guardano e basta)
      amb.banchi.forEach(function (b) {
        var d = b.vx >= 0 ? 1 : -1;
        for (var j = 0; j < b.n; j++) {
          var fx2 = b.x - d * (j % 3) * 1.7 - d * Math.floor(j / 3) * .8, fy = b.y + (j % 3 - 1) * 1.1 + Math.floor(j / 3) * 1.2 + Math.sin(t * 3 + j + b.f) * .35;
          ctx.save(); ctx.translate(fx2, fy); ctx.scale(d, 1); ctx.fillStyle = notte ? "rgba(140,170,210,.55)" : "rgba(220,235,245,.85)";
          ctx.beginPath(); ctx.ellipse(0, 0, .75, .26, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-.6, 0); ctx.lineTo(-1.05, -.3 + Math.sin(t * 14 + j) * .1); ctx.lineTo(-1.05, .3); ctx.closePath(); ctx.fill(); ctx.restore();
        }
      });
      // le ombre dei pesci: muovono la coda (di che pesce si tratta lo scopri quando lo prendi, o quando arriva vicino)
      pesci.forEach(function (p) {
        if (p.stato === "preso") return;
        var pos = p, dir = p.vx >= 0 ? 1 : -1, vel = p.stato === "fugge" ? 28 : p.stato === "va" ? 14 : 8;
        if (st.fase === "lotta" && p === st.pesce) { pos = posPesce(); dir = st.lotta.strappo ? (Math.sin(t * 20) > 0 ? 1 : -1) : -1; vel = st.lotta.strappo ? 30 : 16; }
        ombraPesce(p.L, pos.x, pos.y, dir, t * vel + p.t, notte);
      });
      // le alghe che ondeggiano
      amb.alghe.forEach(function (a) {
        var n = 6, px = a.x, py = a.b, cols = notte ? ["#16402a", "#1d4d32", "#12361f"] : ["#2f9e44", "#37b24d", "#2b8a3e"];
        ctx.strokeStyle = PIOVE ? mix(cols[a.c], "#5a6a60", .25) : cols[a.c];
        for (var j = 1; j <= n; j++) {
          var nx = a.x + Math.sin(t * 1.1 + a.f + j * .45) * j * .32, ny = a.b - a.h * j / n;
          ctx.lineWidth = a.w * (1.15 - j / n); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke(); px = nx; py = ny;
        }
      });
      // le bolle e gli altri effetti sott'acqua
      fx.forEach(function (f) { if (f.t === "b") { ctx.globalAlpha = .55; ctx.strokeStyle = "#e7f5ff"; ctx.lineWidth = .14; ctx.beginPath(); ctx.arc(f.x + Math.sin(f.y * .8) * .4, f.y, .42, 0, 7); ctx.stroke(); } });
      ctx.globalAlpha = 1;
      // la superficie: la fascia chiara, la scia di luce del sole (o della luna), le onde e i luccichii
      var fs = ctx.createLinearGradient(0, SUP - .3, 0, SUP + 3.5); fs.addColorStop(0, "rgba(255,255,255," + (notte ? .18 : .4) + ")"); fs.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = fs; ctx.fillRect(R.x0, SUP - .3, R.x1 - R.x0, 3.8);
      if (!PIOVE) { var ax2 = P.astro[0]; for (i = 0; i < 9; i++) { var yy = SUP + .5 + i * .75, ww = (4.5 - i * .4) * (.75 + .25 * Math.sin(t * 3 + i * 1.7)); ctx.fillStyle = "rgba(" + P.luce + "," + (.55 - i * .05) + ")"; ctx.fillRect(ax2 - ww / 2 + Math.sin(t * 2 + i) * .6, yy, ww, .3); } }
      ctx.strokeStyle = notte ? "rgba(160,190,255,.4)" : "rgba(255,255,255,.7)"; ctx.lineWidth = .32; ctx.beginPath();
      for (var x = R.x0; x <= R.x1; x += 1) { var y = onde(x); if (x === R.x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      for (i = 0; i < 16; i++) { var lx2 = ((i * 13.7 + t * 1.6) % 112) - 6, la = Math.sin(t * 3.1 + i * 2.3); if (la < .4) continue; stellina(lx2, onde(lx2) - .15, .55 * la, "rgba(" + P.luce + "," + la + ")"); }
      // gli schizzi, le increspature e i pesciolini che saltano
      fx.forEach(function (f) {
        if (f.t === "o") { ctx.globalAlpha = Math.max(0, f.vita) * .75; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = .2; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * .22, 0, 0, 7); ctx.stroke(); }
        else if (f.t === "g") { ctx.globalAlpha = Math.min(1, f.vita * 2); ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(f.x, f.y, .32, 0, 7); ctx.fill(); }
        else if (f.t === "salta") { var k2 = 1 - f.vita / .7; ctx.globalAlpha = 1; ctx.save(); ctx.translate(f.x + f.d * k2 * 4, SUP - Math.sin(k2 * Math.PI) * 3.2); ctx.rotate(f.d * (-.9 + k2 * 1.8)); ctx.scale(f.d, 1); ctx.fillStyle = notte ? "#9fb6d8" : "#dfe8ee"; ctx.beginPath(); ctx.ellipse(0, 0, 1.1, .4, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-.9, 0); ctx.lineTo(-1.5, -.4); ctx.lineTo(-1.5, .4); ctx.closePath(); ctx.fill(); ctx.restore(); }
      });
      ctx.globalAlpha = 1;
      // la lanterna del pontile: di sera e di notte (e quando piove) si accende
      var lumX = PONTE + 1.6, lumY = SUP - 15.6, accesa = notte || FASE === "tramonto" || PIOVE;
      if (accesa) { var fl2 = .85 + .15 * Math.sin(t * 7) * Math.sin(t * 3.3), gl = ctx.createRadialGradient(lumX, lumY, 0, lumX, lumY, 9); gl.addColorStop(0, "rgba(255,214,120," + .6 * fl2 + ")"); gl.addColorStop(1, "rgba(255,214,120,0)"); ctx.fillStyle = gl; ctx.fillRect(lumX - 9, lumY - 9, 18, 18); ctx.fillStyle = "rgba(255,214,120," + .25 * fl2 + ")"; ctx.fillRect(lumX - 3, SUP + .4, 6, .35); }
      ctx.fillStyle = "#343a40"; ctx.fillRect(lumX - .8, lumY - 1.2, 1.6, .5); ctx.fillStyle = accesa ? "#ffd875" : "#cfd8dc"; ctx.fillRect(lumX - .65, lumY - .7, 1.3, 1.6); ctx.fillStyle = "#343a40"; ctx.fillRect(lumX - .8, lumY + .9, 1.6, .4);
      // il pescatore, la canna e il filo
      disegnaPescatore(t);
      // le lucciole (sera e notte)
      lucciole.forEach(function (l) { var a = .4 + .6 * Math.abs(Math.sin(t * 1.7 + l.t)); ctx.globalAlpha = a; var gx = l.x + Math.sin(t * .6 + l.t) * 3, gy = l.y + Math.cos(t * .8 + l.t) * 2, gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 1.4); gg.addColorStop(0, "rgba(255,245,160,1)"); gg.addColorStop(1, "rgba(255,245,160,0)"); ctx.fillStyle = gg; ctx.fillRect(gx - 1.4, gy - 1.4, 2.8, 2.8); });
      ctx.globalAlpha = 1;
      // davanti: le grandi alghe scure in primo piano e la pioggia
      amb.davanti.forEach(function (a) {
        var px = a.x, py = R.y1 + 2; ctx.strokeStyle = notte ? "rgba(4,16,12,.9)" : "rgba(14,52,34,.82)";
        for (var j = 1; j <= 7; j++) { var nx = a.x + Math.sin(t * .8 + a.f + j * .5) * j * .45, ny = R.y1 + 2 - a.h * j / 7; ctx.lineWidth = 2.6 * (1.1 - j / 7); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke(); px = nx; py = ny; }
      });
      if (PIOVE) { ctx.strokeStyle = "rgba(220,230,245,.38)"; ctx.lineWidth = .14; amb.pioggia.forEach(function (gp) { ctx.beginPath(); ctx.moveTo(gp.x, gp.y); ctx.lineTo(gp.x - .55, gp.y + 3); ctx.stroke(); }); }
      // la strada del lancio mentre carichi (dove arriva, più o meno)
      if (st.fase === "carica") {
        var G0 = geo(), x1 = 27 + st.carica * 68, h = 12 + (x1 - G0.punta.x) * .25;
        for (i = 1; i <= 14; i++) { var kk = i / 14, px3 = G0.punta.x + (x1 - G0.punta.x) * kk, py3 = G0.punta.y + (SUP - G0.punta.y) * kk - Math.sin(kk * Math.PI) * h; ctx.globalAlpha = .25 + .55 * (1 - kk); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(px3, py3, .32, 0, 7); ctx.fill(); }
        ctx.globalAlpha = .6; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = .25; ctx.beginPath(); ctx.ellipse(x1, SUP, 2.2, .55, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      }
      // in pixel: il pesce che salta fuori, il "❗", la forza del lancio, il filo, la vignetta
      schermo(ctx);
      if (st.fase === "salto") disegnaSalto();
      if (st.pesce && st.pesce.stato === "abbocca") esclamativo();
      ctx.drawImage(vignetta, 0, 0, cw, ch);
      if (st.fase === "carica") misuraForza();
      if (st.fase === "lotta") tensione(st.lotta.tens, st.lotta.d);
    }
    function onde(x) { return SUP + Math.sin(x * .45 + st.t * 1.7) * .26 + Math.sin(x * 1.05 - st.t * 2.4) * .13; }
    function stellina(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .25, y - r * .25); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .25, y + r * .25); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .25, y + r * .25); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .25, y - r * .25); ctx.closePath(); ctx.fill(); }
    function ombraPesce(L, x, y, dir, fase2, notte) {
      var h = L * .34; ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
      ctx.fillStyle = notte ? "rgba(0,4,14,.28)" : "rgba(6,26,44,.16)"; ctx.beginPath(); ctx.ellipse(0, 0, L * .62, h * .72, 0, 0, 7); ctx.fill();   // il bordo sfumato
      ctx.fillStyle = notte ? "rgba(0,4,14,.55)" : "rgba(6,26,44,.36)";
      ctx.beginPath(); ctx.ellipse(0, 0, L * .5, h * .5, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(-L * .42, 0); ctx.rotate(Math.sin(fase2) * .45); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-L * .32, -h * .58); ctx.quadraticCurveTo(-L * .22, 0, -L * .32, h * .58); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.restore();
    }
    function disegnaPescatore(t) {
      var G = geo(), P = G.piedi, fw = 16, fh = fw * 1.32, resp = 1 + Math.sin(t * 2) * .008;
      // il filo (prima della canna, così parte dalla punta)
      if (st.fase === "volo") {
        var v = st.volo, k = v.t / v.dur, bx = v.x0 + (v.x1 - v.x0) * k, by = v.y0 + (v.y1 - v.y0) * k - Math.sin(k * Math.PI) * (12 + (v.x1 - v.x0) * .25);
        filo(G.punta, { x: bx, y: by }, 2); galleggiante(bx, by, 0);
      } else if (st.fase === "attesa") {
        var gy = SUP + st.gal.dip * 1.6 + Math.sin(t * 2.2) * .12;
        filo(G.punta, { x: st.gal.x, y: gy }, 3 + Math.abs(st.gal.x - G.punta.x) * .05);
        ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = .1; ctx.beginPath(); ctx.moveTo(st.gal.x, gy + .8); ctx.lineTo(st.hx, st.hy); ctx.stroke();
        amo(st.hx, st.hy); galleggiante(st.gal.x, gy, st.gal.dip);
      } else if (st.fase === "lotta") {
        var q = posPesce(), teso = st.lotta.tens;
        ctx.strokeStyle = teso > .8 ? "#ff6b6b" : teso > .55 ? "#ffd43b" : "rgba(255,255,255,.9)"; ctx.lineWidth = .2;
        ctx.beginPath(); ctx.moveTo(G.punta.x, G.punta.y); ctx.lineTo(q.x + (st.lotta.strappo ? Math.sin(t * 50) * .15 : 0), q.y); ctx.stroke();
        if (q.y < SUP + 6) { if (Math.random() < .3) goccia(q.x, SUP, 1); }   // vicino alla superficie fa gli schizzi
        if (st.lotta.d < .25) rivela(st.pesce, q, (.25 - st.lotta.d) / .25);
      } else if (st.fase === "salto") {
        var sl = st.salto, kk = Math.min(1, sl.t / .75), sx = sl.x0 + (12 - sl.x0) * kk, sy = sl.y0 + (SUP - 22 - sl.y0) * kk - Math.sin(kk * Math.PI) * 18;
        ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = .18; ctx.beginPath(); ctx.moveTo(G.punta.x, G.punta.y); ctx.lineTo(sx, sy); ctx.stroke();
      }
      // la canna (prima dell'avatar, così il pugno la stringe): grossa vicino alla mano e sottile in punta, si piega quando il filo tira
      var M = G.mano, C = G.ctrl, T = G.punta, col = laCanna().col, n = 8, px = M.x - (T.x - M.x) * .1, py = M.y - (T.y - M.y) * .1;
      ctx.strokeStyle = col;
      for (var j = 1; j <= n; j++) {
        var u = j / n, a1 = (1 - u) * (1 - u), b1 = 2 * (1 - u) * u, c1 = u * u, qx = a1 * M.x + b1 * C.x + c1 * T.x, qy = a1 * M.y + b1 * C.y + c1 * T.y;
        ctx.lineWidth = .62 * (1 - u) + .14; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke(); px = qx; py = qy;
      }
      ctx.fillStyle = "#adb5bd"; ctx.beginPath(); ctx.arc(M.x + .3, M.y + .9, .85, 0, 7); ctx.fill(); ctx.strokeStyle = "#495057"; ctx.lineWidth = .15; ctx.stroke();   // il mulinello
      if (st.fase === "lotta" && premuto) { ctx.strokeStyle = "#495057"; ctx.lineWidth = .14; var ang = t * 25; ctx.beginPath(); ctx.moveTo(M.x + .3, M.y + .9); ctx.lineTo(M.x + .3 + Math.cos(ang) * .8, M.y + .9 + Math.sin(ang) * .8); ctx.stroke(); }   // la manovella che gira
      st.punta = T;
      // l'avatar: respira, si piega, salta di gioia; le braccia tengono la canna e la seguono
      var pc = posaCanna(angoloBraccio()), fig = pc && pc.im.complete && pc.im.naturalWidth ? pc.im : figura;
      ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(st.lean || 0); ctx.scale(1, resp);
      if (fig && fig.complete && fig.naturalWidth) ctx.drawImage(fig, -fw / 2, -fh * .96 + .6, fw, fh);
      else { ctx.fillStyle = "#4c6ef5"; ctx.fillRect(-2, -18, 4, 18); }
      ctx.restore();
    }
    function filo(a, b, cala) { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = .12; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, Math.max(a.y, b.y) + cala, b.x, b.y); ctx.stroke(); }
    function galleggiante(x, y, dip) {
      ctx.save(); ctx.translate(x, y);
      ctx.strokeStyle = "#343a40"; ctx.lineWidth = .14; ctx.beginPath(); ctx.moveTo(0, -.9); ctx.lineTo(0, -2.2); ctx.stroke(); ctx.fillStyle = "#fa5252"; ctx.beginPath(); ctx.arc(0, -2.3, .22, 0, 7); ctx.fill();
      var gb = ctx.createRadialGradient(-.35, -.4, .1, 0, 0, 1); gb.addColorStop(0, "#ffffff"); gb.addColorStop(1, "#dee2e6");
      ctx.fillStyle = gb; ctx.beginPath(); ctx.arc(0, 0, .95, 0, Math.PI); ctx.fill();
      var gr = ctx.createRadialGradient(-.35, -.5, .1, 0, 0, 1); gr.addColorStop(0, "#ff8787"); gr.addColorStop(1, "#c92a2a");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, .95, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.ellipse(-.35, -.45, .25, .15, -.5, 0, 7); ctx.fill();
      ctx.restore();
    }
    function amo(x, y) { ctx.strokeStyle = "#ced4da"; ctx.lineWidth = .14; ctx.beginPath(); ctx.arc(x, y + .5, .45, -1.2, Math.PI * .9); ctx.stroke(); ctx.fillStyle = "#e599f7"; ctx.beginPath(); ctx.ellipse(x + .25, y + 1, .4, .22, .6, 0, 7); ctx.fill(); }
    function rivela(p, q, a) {   // il pesce che arriva vicino si vede coi suoi colori
      if (!p.sp) return; var o = aSchermo(q.x, q.y);
      ctx.save(); schermo(ctx); ctx.globalAlpha = Math.min(1, a * 1.2); ctx.translate(o.x, o.y); ctx.scale(-1, 1); ctx.rotate(Math.sin(st.t * 12) * .08); disegnaPesce(ctx, p.sp, p.L * 1.5 * S * cam.z); ctx.restore(); mondo(ctx);
    }
    function disegnaSalto() {   // il pesce che salta fuori dall'acqua, al rallentatore, coi raggi se è raro
      var sl = st.salto, kk = Math.min(1, sl.t / .75), sx = sl.x0 + (12 - sl.x0) * kk, sy = sl.y0 + (SUP - 22 - sl.y0) * kk - Math.sin(kk * Math.PI) * 18, o = aSchermo(sx, sy), r = sl.p.sp ? sl.p.sp.r : 1;
      if (r >= 2) { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(st.t * 1.5); var rr = (6 + r * 3) * S * cam.z; ctx.fillStyle = r >= 4 ? "rgba(255,212,59,.35)" : r >= 3 ? "rgba(204,93,232,.3)" : "rgba(116,192,252,.28)"; for (var i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(rr, -rr * .12); ctx.lineTo(rr, rr * .12); ctx.closePath(); ctx.fill(); } ctx.restore(); }
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(-.6 + kk * 1.4);
      if (sl.p.sp) disegnaPesce(ctx, sl.p.sp, Math.max(8, sl.p.L * 2) * S * cam.z); else { ctx.font = Math.round(7 * S) + "px system-ui"; ctx.textAlign = "center"; ctx.fillText(sl.p.cur.ico, 0, 0); }
      ctx.restore();
    }
    function esclamativo() {   // il "❗" sopra la testa: tocca adesso!
      var p = st.pesce, k = Math.min(1, ((p.tAbb0 || .6) - p.tAbb) / .12), o = aSchermo(12, SUP - 31), sc = (.6 + .4 * k) * S * cam.z;
      ctx.save(); ctx.translate(o.x, o.y); ctx.scale(sc, sc);
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = .15; arrot(ctx, -2, -2.6, 4, 4.2, 1.2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-.6, 1.5); ctx.lineTo(0, 2.6); ctx.lineTo(.6, 1.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#f03e3e"; ctx.font = "900 3.4px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("!", 0, -.4);
      ctx.restore();
    }
    function misuraForza() {   // la forza del lancio: una colonnina accanto al pescatore
      var o = aSchermo(3.5, SUP - 38), bw = Math.max(10, S * 2.6), bh = S * 20;
      ctx.fillStyle = "rgba(0,0,0,.45)"; arrot(ctx, o.x, o.y, bw, bh, bw / 2); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.5; ctx.stroke();
      var gk = ctx.createLinearGradient(0, o.y + bh, 0, o.y); gk.addColorStop(0, "#51cf66"); gk.addColorStop(.6, "#ffd43b"); gk.addColorStop(1, "#ff6b6b");
      ctx.fillStyle = gk; arrot(ctx, o.x + 2, o.y + 2 + (bh - 4) * (1 - st.carica), bw - 4, (bh - 4) * st.carica, (bw - 4) / 2); ctx.fill();
    }
    function tensione(t, d) {   // a destra quanto è teso il filo; in alto quanto manca al pontile
      var bx = cw - Math.max(16, S * 4.6), bw = Math.max(12, S * 3), top = Math.max(110, ch * .22), bh = Math.min(S * 55, ch * .5);
      ctx.fillStyle = "rgba(0,0,0,.5)"; arrot(ctx, bx, top, bw, bh, bw / 2); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "rgba(255,107,107,.32)"; ctx.fillRect(bx + 2, top + 2, bw - 4, (bh - 4) * .2);
      var col = t > .8 ? "#ff6b6b" : t > .55 ? "#ffd43b" : "#51cf66", tt = Math.min(1, t);
      if (t > .8) { ctx.shadowColor = "#ff6b6b"; ctx.shadowBlur = 12 + Math.sin(st.t * 20) * 6; }
      ctx.fillStyle = col; arrot(ctx, bx + 2, top + 2 + (bh - 4) * (1 - tt), bw - 4, (bh - 4) * tt, (bw - 4) / 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.font = "900 " + Math.max(10, Math.round(2.4 * S)) + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText("FILO", bx + bw / 2, top - 6);
      // quanto manca: dal pesce al pontile
      var px = cw * .2, pw = cw * .56, py = Math.max(96, ch * .17), pf = px + pw * Math.max(0, Math.min(1, d / 1.3));   // il pesce si avvicina al pontile (a sinistra)
      ctx.fillStyle = "rgba(0,0,0,.45)"; arrot(ctx, px, py - 6, pw, 12, 6); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 6, py); ctx.lineTo(pf, py); ctx.stroke();
      ctx.font = Math.round(13 + S) + "px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🎣", px - 10, py); ctx.save(); ctx.translate(pf, py); ctx.scale(-1, 1); ctx.fillText("🐟", 0, 0); ctx.restore(); ctx.textBaseline = "alphabetic";
    }
    function arrot(x, a, b, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    function chiudi() { cancelAnimationFrame(anim); window.removeEventListener("resize", misura); }

    if (GARA) s._gara = {   // per la gara: il tempo, la classifica, gli avvisi e la fine
      stato: function (o) {
        if (o.fineAt) gara.fineAt = o.fineAt;
        if (o.righe) { gara.righe = o.righe; var me = o.righe.filter(function (r) { return r.tu; })[0]; if (me && me.kg > gara.kg) gara.kg = me.kg; disegnaClassi(); aggTesta(); }
        if (o.avviso && o.avviso.s !== gara.ultimo) { gara.ultimo = o.avviso.s; if (o.avviso.testo) dimmi(o.avviso.testo); }
      },
      ferma: function (testo) {   // tempo scaduto: la pescata in corso si perde
        gara.finita = true; if (st.pesce && st.pesce.stato !== "preso") st.pesce.stato = "fugge";
        if (st.fase !== "pronto" && st.fase !== "carta") fine(false);
        suggerisci(""); dimmi(testo || "⏱️ Tempo scaduto!"); premuto = false;
      },
      chiedi: function (titolo, testo, siTesto, si) { finestra(titolo, [el("p", "pe-frase", testo)], [{ testo: "▶ Continua a pescare", cls: "btn-primario", fn: chiudiSopra }, { testo: siTesto, fn: si }]); }
    };
    s._monta = function () {
      misura(); aggTesta();
      suggerisci(GARA ? "Tieni premuto per lanciare: vince chi pesca più chili!" : eschePronte() > 0 ? "Tieni premuto per caricare il lancio, poi lascia" : "Esche finite per oggi");
      if (PIOVE) { dimmi("🌧️ Piove: i pesci abboccano più spesso!"); nome.textContent = "🎣 Laghetto 🌧️"; }
      else if (!D.tot && !GARA) dimmi("Benvenuto al laghetto! 🎣");
      anim = requestAnimationFrame(function (o) { ult = o; giro(o); });
    };
    s._chiudi = chiudi;
    window.__pesca = { st: st, disegna: function () { disegna(); }, pesci: function () { return pesci; }, D: D, lascia: lascia, avanza: function (sec) { for (var i = 0; i < sec * 60; i++) aggiorna(1 / 60); }, premi: function (v) { premuto = v; } };   // (per le prove)
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
      ".pe-vendi{flex:none;height:32px;padding:0 10px;border:0;border-radius:10px;cursor:pointer;font:inherit;font-weight:900;font-size:.8rem;color:#1a1440;background:#ffe066}",
      ".pe-vendi:disabled{opacity:.45;cursor:default}",
      ".pe-attr{display:flex;flex-direction:column;gap:6px;text-align:left}",
      ".pe-oggetto{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:12px;background:rgba(255,255,255,.08)}",
      ".pe-oggetto.uso{box-shadow:inset 0 0 0 2px #8ce99a}",
      ".pe-canna{flex:none;width:8px;height:38px;border-radius:4px;transform:rotate(18deg);box-shadow:0 0 0 1px rgba(255,255,255,.3)}",
      ".pe-esca{flex:none;width:30px;font-style:normal;font-size:1.5rem;text-align:center}",
      ".pe-testo{flex:1;min-width:0;display:flex;flex-direction:column}.pe-testo b{font-size:.85rem}.pe-testo small{font-size:.72rem;color:#a5d8ff}",
      ".pe-due{flex:none;display:flex;flex-direction:column;gap:4px;align-items:stretch}",
      ".pe-usa{height:26px;border:0;border-radius:8px;cursor:pointer;font:inherit;font-weight:900;font-size:.75rem;color:#fff;background:rgba(140,233,154,.35)}",
      ".pe-inuso{font-size:.72rem;font-weight:900;color:#8ce99a;text-align:center}",
      ".pe-giu .pe-bott{font-size:.86rem;padding:0 4px}",
      // la gara: la classifica dal vivo in alto a destra e il tempo che diventa rosso
      ".pe-classi{position:absolute;right:8px;top:calc(52px + env(safe-area-inset-top));z-index:3;display:flex;flex-direction:column;gap:3px;align-items:flex-end;pointer-events:none}",
      ".pe-gara-b{position:absolute;left:8px;top:calc(52px + env(safe-area-inset-top));z-index:3;height:32px;padding:0 12px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-weight:900;font-size:.8rem;color:#1a1440;background:#ffe066;box-shadow:0 4px 12px rgba(0,0,0,.25)}",
      ".pe-cl{padding:3px 9px;border-radius:999px;font-weight:900;font-size:.78rem;color:#fff;background:rgba(0,0,0,.45);white-space:nowrap}",
      ".pe-cl.tu{color:#1a1440;background:#ffe066}",
      ".pe-in-gara .pe-avviso{top:calc(158px + env(safe-area-inset-top))}",
      // la carta del pesce preso: si gira entrando, una luce ci passa sopra, il pesce dondola; epici e leggendari coi raggi che girano
      ".pe-presa{position:relative;isolation:isolate;overflow:hidden;animation:peGira .55s cubic-bezier(.3,1.3,.5,1)}",
      "@keyframes peGira{from{transform:perspective(700px) rotateY(90deg) scale(.85);opacity:0}}",
      ".pe-presa::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,.28) 50%,transparent 60%);transform:translateX(-130%);animation:peLuccica 1.1s .45s ease-out forwards;pointer-events:none}",
      "@keyframes peLuccica{to{transform:translateX(130%)}}",
      ".pe-presa.r3::before,.pe-presa.r4::before{content:'';position:absolute;left:50%;top:25%;width:170%;height:170%;margin:-85% 0 0 -85%;background:repeating-conic-gradient(rgba(204,93,232,.24) 0 9deg,transparent 9deg 18deg);animation:peRaggi 9s linear infinite;z-index:-1;pointer-events:none}",
      ".pe-presa.r4::before{background:repeating-conic-gradient(rgba(255,212,59,.32) 0 9deg,transparent 9deg 18deg)}",
      ".pe-presa.r4{box-shadow:0 12px 40px rgba(0,0,0,.5),0 0 44px rgba(255,212,59,.5),inset 0 0 0 2px rgba(255,212,59,.7)}",
      ".pe-presa.r3{box-shadow:0 12px 40px rgba(0,0,0,.5),0 0 36px rgba(204,93,232,.45),inset 0 0 0 2px rgba(204,93,232,.6)}",
      "@keyframes peRaggi{to{transform:rotate(360deg)}}",
      ".pe-presa .pe-fig canvas{animation:peDondola 1.4s ease-in-out infinite alternate}",
      "@keyframes peDondola{from{transform:rotate(-4deg)}to{transform:rotate(4deg) translateY(-3px)}}",
      ".pe-nome.pe-poco{color:#ff6b6b;animation:pePoco .5s ease-in-out infinite alternate}",
      "@keyframes pePoco{to{transform:scale(1.08)}}"
    ].join("");
    document.head.appendChild(st);
  }

  window.SGPesca = { crea: crea, PESCI: PESCI, CURIOSITA: CURIOSITA, disegnaPesce: disegnaPesce, immaginePesce: immaginePesce, svgPesce: svgPesce, pesce: pesce, pesoKg: pesoKg, kg: kg };
})();
