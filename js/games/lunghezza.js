/* =========================================================
   STESSA LUNGHEZZA D'ONDA (id "lunghezza") — il nostro Wavelength.
   A turno uno fa il SENSITIVO: sul quadrante a mezzaluna c'è una scala (es. Sopravvalutato ←→ Sottovalutato)
   e un bersaglio nascosto che vede solo lui. Gli altri spostano la lancetta per trovarlo: 4, 3 o 2 punti.
   - 🤔 "Cosa ne pensi?" (di partenza): esce una parola pronta (o la scrive lui) e il sensitivo la mette dove pensa lui.
   - 🎯 "Classico": bersaglio a caso, il sensitivo inventa la parola. 🔀 "Misto": un turno per modo.
   - Online (Sala della serata): 👥 due squadre (lancetta comune che tutti vedono muoversi, scommessa ⬅️/➡️)
     oppure 🙋 ognuno per sé (ognuno la sua lancetta; sotto i 4 si passa da soli a questa).
   - Sullo stesso telefono: 👥 due squadre oppure 🤝 tutti insieme contro il gioco.
   Partito dal modello dei giochi online (saletta, rientri, uscite, fine partita, Sala).
   Contenuti: data/lunghezza-scale.js (window.SG_LUNGHEZZA) e data/lunghezza-parole.js (window.SG_LUNGHEZZA_PAROLE).
   ========================================================= */
(function () {
  "use strict";

  var ID = "lunghezza";
  var MIN = 2, MAX = 16;
  var FASCE = [2, 6, 10];          // distanza dal centro del bersaglio (scala 0-100): fino a 2 → 4 punti, fino a 6 → 3, fino a 10 → 2
  var T_COSA = 45, T_CLASSICO = 75, T_SCOMMESSA = 15, T_RIVELA = 11, T_SALTA = 5;   // secondi
  var MANO_MS = 1500;              // la lancetta comune: chi la muove la tiene finché è fermo da più di 1,5 s
  var TURNI_INSIEME = 7;           // "Tutti insieme" sullo stesso telefono
  var SQ = ["A", "B"];
  var FRASI = ["Più a destra!", "Più a sinistra!", "Fidatevi di me", "Ma che dici?!", "È ovvio!", "Ci sta", "Non ci credo", "Lo sapevo!"];

  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }   // 1.000
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function mescola(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function caso(a) { return a[Math.floor(Math.random() * a.length)]; }
  function lim(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function valore(v) { v = Number(v); return isFinite(v) ? lim(Math.round(v * 2) / 2, 0, 100) : 50; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function pulisci(s) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, 30); }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) {} }
  function nuovoId() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9); }
  function tx(n, s) { s = s == null ? "" : String(s); if (n && n.textContent !== s) n.textContent = s; }
  function puntiDi(lan, bers) { var d = Math.abs(lan - bers); return d <= FASCE[0] ? 4 : d <= FASCE[1] ? 3 : d <= FASCE[2] ? 2 : 0; }
  function testoPunti(n) { return n === 1 ? "1 punto" : fmtN(n) + " punti"; }
  // dove sta un punto della scala, detto a parole (frase fissa, senza accordi da sbagliare): "tutto verso «Sopravvalutato»"
  function doveSta(v, scala) {
    if (!scala) return "";
    if (v >= 45 && v <= 55) return "proprio a metà";
    var d = Math.abs(v - 50), lato = v < 50 ? scala[0] : scala[1];
    return (d >= 38 ? "tutto verso" : d >= 18 ? "verso" : "un po' verso") + " «" + lato + "»";
  }
  // l'indizio non può usare le parole della scala ("Caldo" su Freddo ←→ Caldo)
  function indizioVietato(testo, scala) {
    var vietate = [];
    (scala || []).forEach(function (lato) { norm(lato).split(" ").forEach(function (w) { if (w.length >= 4) vietate.push(w); }); });
    return norm(testo).split(" ").some(function (w) { return vietate.indexOf(w) >= 0; });
  }

  // =========================================================
  //  📝 LE NOSTRE SCALE: quelle scritte dal gruppo («Caldo ↔ Freddo»). Le scrive l'host nelle regole: restano sul suo
  //  profilo (SG.listaProfilo("lunghezza")) e su questo telefono; viaggiano con le regole fino all'host (imp.nostre).
  //  Dentro sono "Caldo|Freddo". In partita: mescolate (circa 1 turno su 3), solo le nostre, o solo quelle del gioco.
  // =========================================================
  var MAX_NOSTRE = 120, MAX_LATO = 24, LS_NOSTRE = "sg-lu-nostre";
  function pulisciLato(s) {
    s = String(s || "").replace(/[’`´]/g, "'").replace(/\s+/g, " ").trim();
    if (!s || s.length > MAX_LATO || !/^[A-Za-zÀ-ÖØ-öø-ÿ0-9' .!?]+$/.test(s) || norm(s).replace(/ /g, "").length < 2) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  // una riga scritta a mano: «Caldo ↔ Freddo», «Caldo - Freddo», «Caldo / Freddo», «Caldo|Freddo»
  function leggiScala(riga) {
    var r = String(riga || "").trim(); if (!r) return null;
    var parti = r.split(/\s*(?:↔|⟷|<->|<=>|←→|<>|\|)\s*/);
    if (parti.length !== 2) parti = r.split(/\s+[-–—]+\s+/);
    if (parti.length !== 2) parti = r.split(/\s*[-–—\/]\s*/);
    if (parti.length !== 2) return null;
    var a = pulisciLato(parti[0]), b = pulisciLato(parti[1]);
    if (!a || !b || norm(a) === norm(b)) return null;
    return a + "|" + b;
  }
  function chiaveScala(s) { var p = String(s).split("|"); return norm(p[0]) + "|" + norm(p[1]); }
  function leggiNostre(lista) {
    var out = [], visti = {};
    (Array.isArray(lista) ? lista : []).forEach(function (v) {
      var s = leggiScala(v); if (!s || out.length >= MAX_NOSTRE) return;
      var k = chiaveScala(s), k2 = k.split("|").reverse().join("|");   // «Freddo ↔ Caldo» è la stessa di «Caldo ↔ Freddo»
      if (visti[k] || visti[k2]) return;
      visti[k] = 1; out.push(s);
    });
    return out;
  }
  function scalaTesto(s) { var p = String(s).split("|"); return p[0] + " ↔ " + p[1]; }
  // "mix" = mescolate (di base), "solo" = solo le nostre, "no" = solo quelle del gioco
  function modoNostre(i) { var m = i && i.nostreModo; return m === "solo" || m === "no" ? m : "mix"; }
  function nostreSalvate() {
    var l = [];
    try { l = leggiNostre(window.SG && SG.listaProfilo ? SG.listaProfilo("lunghezza") : []); } catch (e) {}
    if (!l.length) try { l = leggiNostre(JSON.parse(localStorage.getItem(LS_NOSTRE) || "[]")); } catch (e) {}
    return l;
  }
  function salvaNostre(l) {
    try { if (window.SG && SG.salvaListaProfilo) SG.salvaListaProfilo("lunghezza", l.slice()); } catch (e) {}
    try { localStorage.setItem(LS_NOSTRE, JSON.stringify(l)); } catch (e) {}
  }
  // le regole con cui parte l'host (o il telefono in mezzo al tavolo): se mancano le scale, quelle salvate
  function conNostre(imp) {
    imp = imp || {};
    if (Array.isArray(imp.nostre)) return imp;
    var x = {}; Object.keys(imp).forEach(function (k) { x[k] = imp[k]; });
    x.nostre = nostreSalvate();
    return x;
  }

  // =========================================================
  //  CONTENUTI: scale e parole (mai doppioni nella partita, e le ultime uscite evitate nelle partite dopo)
  // =========================================================
  function dati() { return window.SG_LUNGHEZZA || { tipi: {}, temi: [] }; }
  function tuttiTemi() { return (dati().temi || []).map(function (x) { return x.id; }); }
  var LS_SC = "sg-lu-scale", LS_PA = "sg-lu-parole";
  function leggiLS(k) { try { var a = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function scriviLS(k, a, max) { try { localStorage.setItem(k, JSON.stringify(a.slice(-max))); } catch (e) {} }
  function creaMazzo(imp) {
    var D = dati(), accesi = imp.temi && imp.temi.length ? imp.temi : tuttiTemi(), visti = {}, tutte = [];
    (D.temi || []).forEach(function (te) {
      if (accesi.indexOf(te.id) < 0) return;
      (te.scale || []).forEach(function (s) {
        var p = String(s).split("|"); if (p.length < 2) return;
        var k = norm(p[0]) + "|" + norm(p[1]); if (visti[k]) return; visti[k] = 1;
        tutte.push({ sx: p[0], dx: p[1], tipi: p[2] || "*", k: k });
      });
    });
    var P = {}, PW = window.SG_LUNGHEZZA_PAROLE || {};
    Object.keys(PW).forEach(function (tp) { if (tp === "f" && !imp.famosi) return; P[tp] = String(PW[tp] || "").split("|").map(function (w) { return w.trim(); }).filter(Boolean); });
    var tipiTutti = Object.keys(P);
    var M = { usateS: {}, usateP: {}, usateN: {}, recS: leggiLS(LS_SC), recP: leggiLS(LS_PA) };
    function tipiDi(s) { if (s.tipi === "-") return []; if (s.tipi === "*") return tipiTutti; return s.tipi.split("").filter(function (x) { return tipiTutti.indexOf(x) >= 0; }); }
    function libere(tp) { return (P[tp] || []).filter(function (w) { return !M.usateP[w]; }); }
    // 📝 le nostre scale (vanno bene con tutte le parole): nella stessa partita non si ripetono mai (usateN non si azzera)
    var nostre = leggiNostre(imp.nostre).map(function (s) { var p = s.split("|"); return { sx: p[0], dx: p[1], tipi: "*", k: "n|" + chiaveScala(s), nostra: true }; });
    var mN = nostre.length ? modoNostre(imp) : "no";
    function libereN() { return nostre.filter(function (s) { return !M.usateN[s.k]; }); }
    M.nostraOra = function () { return mN !== "no" && libereN().length > 0 && (mN === "solo" || Math.random() < 1 / 3); };   // questo turno ha una scala nostra?
    M.libera = function (s) { if (s && s.nostra) delete M.usateN[s.k]; };   // (Classico: quella che il sensitivo non ha scelto può tornare)
    M.scala = function (modo, nostra) {
      if (nostra) { var ln = libereN(); if (ln.length) { var n = caso(ln); M.usateN[n.k] = 1; return n; } }
      function ok(s) { return !M.usateS[s.k] && (modo !== "cosa" || tipiDi(s).some(function (tp) { return libere(tp).length > 0; })); }
      var c = tutte.filter(ok);
      if (!c.length) { M.usateS = {}; c = tutte.filter(ok); }   // finite (partita lunghissima): si rimescolano
      if (!c.length) return null;
      var nuove = c.filter(function (s) { return M.recS.indexOf(s.k) < 0; });
      var s = caso(nuove.length ? nuove : c);
      M.usateS[s.k] = 1; M.recS.push(s.k);
      return s;
    };
    // n parole adatte alla scala, di tipi diversi quando si può
    M.parole = function (s, n) {
      var tipi = mescola(tipiDi(s)), out = [], giro = 0;
      while (out.length < n && giro < 6) {
        var prima = out.length;
        tipi.forEach(function (tp) {
          if (out.length >= n) return;
          var l = libere(tp).filter(function (w) { return out.indexOf(w) < 0; });
          var nuove = l.filter(function (w) { return M.recP.indexOf(w) < 0; });
          if (l.length) out.push(caso(nuove.length ? nuove : l));
        });
        if (out.length === prima) break;
        giro++;
      }
      out.forEach(function (w) { M.usateP[w] = 1; M.recP.push(w); });
      return out;
    };
    M.salva = function () { scriviLS(LS_SC, M.recS, 200); scriviLS(LS_PA, M.recP, 300); };
    return M;
  }

  // le impostazioni, sempre valide (chiavi del gioco: "modo" è del core)
  function impNorm(i) {
    i = i || {};
    var tt = tuttiTemi(), temi = Array.isArray(i.temi) ? i.temi.filter(function (x) { return tt.indexOf(x) >= 0; }) : tt.slice();
    if (temi.length < 3) temi = tt.slice();
    return { domande: ["cosa", "classico", "misto"].indexOf(i.domande) >= 0 ? i.domande : "cosa",
      formula: ["squadre", "solo", "insieme"].indexOf(i.formula) >= 0 ? i.formula : "squadre",
      traguardo: [7, 10, 15].indexOf(+i.traguardo) >= 0 ? +i.traguardo : 10,
      giri: [1, 2, 3].indexOf(+i.giri) >= 0 ? +i.giri : 2,
      tempo: [45, 60, 90, 120].indexOf(+i.tempo) >= 0 ? +i.tempo : 60,
      temi: temi, famosi: i.famosi !== false,
      nostre: leggiNostre(i.nostre), nostreModo: modoNostre(i) };   // 📝 le nostre scale (viaggiano con le regole fino all'host)
  }
  function modoDelTurno(domande, n) { return domande === "misto" ? (n % 2 === 1 ? "cosa" : "classico") : domande; }

  // =========================================================
  //  SUONI (sintetizzati, niente file; su localhost sono spenti)
  // =========================================================
  function suono(tipo) {
    var ac = null; try { ac = SG.audioCtx && SG.audioCtx(); } catch (e) {}
    if (!ac) return;
    try {
      var ora = ac.currentTime;
      var nota = function (f, t0, dur, forma, vol, f2) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = forma || "triangle"; o.frequency.setValueAtTime(f, ora + t0);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, ora + t0 + dur);
        g.gain.setValueAtTime(0.0001, ora + t0); g.gain.exponentialRampToValueAtTime(vol || 0.1, ora + t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, ora + t0 + dur);
        o.connect(g); g.connect(ac.destination); o.start(ora + t0); o.stop(ora + t0 + dur + 0.05);
      };
      if (tipo === "tamburo") {   // rullo che accelera, poi il colpo
        var tt = 0, passo = 0.12;
        while (tt < 0.6) { nota(95 + Math.random() * 40, tt, 0.06, "square", 0.045); tt += passo; passo = Math.max(0.032, passo * 0.8); }
        nota(70, 0.62, 0.4, "sine", 0.16);
      } else if (tipo === "centro") { [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]].forEach(function (n) { nota(n[0], n[1], n[1] > 0.3 ? 0.55 : 0.14, "triangle", 0.12); }); }
      else if (tipo === "tele") { [[784, 0], [988, 0.1], [1175, 0.2], [1568, 0.3]].forEach(function (n) { nota(n[0], n[1], 0.5, "sine", 0.1); }); }
      else if (tipo === "buono") { nota(660, 0, 0.12, "triangle", 0.1); nota(880, 0.12, 0.3, "triangle", 0.1); }
      else if (tipo === "fuori") nota(330, 0, 0.75, "sine", 0.12, 120);
      else if (tipo === "ding") nota(1320, 0, 0.45, "sine", 0.08);
      else if (tipo === "tic") nota(1050, 0, 0.04, "square", 0.025);
      else if (tipo === "tocco") nota(560, 0, 0.06, "triangle", 0.05);
    } catch (e) {}
  }

  // =========================================================
  //  AVATAR come immagini (bitmap: si muovono leggeri)
  // =========================================================
  var AV = {};
  function srcAvatar(om, nome) {
    if (!window.SGOmino) return "";
    var cfg = om || SGOmino.casuale(nome || "?"), k = JSON.stringify(cfg);
    if (AV[k] == null) { try { AV[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, { busto: true })); } catch (e) { AV[k] = ""; } }
    return AV[k];
  }

  // =========================================================
  //  IL QUADRANTE (SVG fatto una volta; si muovono solo rotazioni e opacità)
  // =========================================================
  var SVG_Q = null;
  function svgQuadrante() {
    function pt(r, a) { var x = a * Math.PI / 180; return (100 + r * Math.sin(x)).toFixed(2) + "," + (104 - r * Math.cos(x)).toFixed(2); }
    function spicchio(r, a1, a2) { return "M100,104 L" + pt(r, a1) + " A" + r + "," + r + " 0 0 1 " + pt(r, a2) + " Z"; }
    var bande = [[-18, -10.8, 2], [-10.8, -3.6, 3], [-3.6, 3.6, 4], [3.6, 10.8, 3], [10.8, 18, 2]];
    var col = { 2: "#ffe066", 3: "#ffa94d", 4: "#ff4d6d" };
    var s = ["<svg viewBox='0 0 200 112' preserveAspectRatio='xMidYMax meet' aria-hidden='true'>",
      "<defs>",
      "<linearGradient id='luFaccia' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#2f86e0'/><stop offset='.5' stop-color='#7357e0'/><stop offset='1' stop-color='#f0782a'/></linearGradient>",
      "<radialGradient id='luLuce' cx='.5' cy='1' r='1'><stop offset='0' stop-color='#fff' stop-opacity='.22'/><stop offset='.55' stop-color='#fff' stop-opacity='.04'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient>",
      "<linearGradient id='luTenda' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#33287e'/><stop offset='1' stop-color='#160f43'/></linearGradient>",
      "<radialGradient id='luPerno' cx='.35' cy='.35' r='.8'><stop offset='0' stop-color='#ffd6e0'/><stop offset='.45' stop-color='#ff2d55'/><stop offset='1' stop-color='#7a0d27'/></radialGradient>",
      "</defs>",
      "<path d='M0.5,104 A99.5,99.5 0 0 1 199.5,104 Z' fill='#221a5e' stroke='#9d8cff' stroke-width='1.1'/>"];
    for (var v = 0; v <= 100; v += 5) {
      var a = -90 + v * 1.8, lungo = v % 25 === 0;
      s.push("<line x1='" + pt(95.5, a).split(",")[0] + "' y1='" + pt(95.5, a).split(",")[1] + "' x2='" + pt(lungo ? 99 : 97.8, a).split(",")[0] + "' y2='" + pt(lungo ? 99 : 97.8, a).split(",")[1] + "' stroke='#d0c7ff' stroke-width='" + (lungo ? 1.1 : 0.6) + "' opacity='.8'/>");
    }
    s.push("<path d='M6,104 A94,94 0 0 1 194,104 Z' fill='url(#luFaccia)'/>",
      "<path d='M6,104 A94,94 0 0 1 194,104 Z' fill='url(#luLuce)'/>",
      "<path d='M30,104 A70,70 0 0 1 170,104' fill='none' stroke='#fff' stroke-opacity='.13' stroke-width='.7'/>",
      "<path d='M54,104 A46,46 0 0 1 146,104' fill='none' stroke='#fff' stroke-opacity='.13' stroke-width='.7'/>",
      "<g class='lu-g-bers' style='visibility:hidden'>");
    bande.forEach(function (b) { s.push("<path d='" + spicchio(93.6, b[0], b[1]) + "' fill='" + col[b[2]] + "' stroke='#fff' stroke-opacity='.75' stroke-width='.5'/>"); });
    bande.forEach(function (b) { var m = (b[0] + b[1]) / 2; s.push("<text x='100' y='22' transform='rotate(" + m + " 100 104)' text-anchor='middle' dominant-baseline='middle' font-size='8.5' font-weight='900' fill='#3a0f2c'>" + b[2] + "</text>"); });
    s.push("</g>", "<g class='lu-g-tenda'><g class='lu-tenda-in'>",
      "<path d='M4.4,104 A95.6,95.6 0 0 1 195.6,104 Z' fill='url(#luTenda)' stroke='#9d8cff' stroke-width='.9'/>");
    // le stelline della tendina (sempre le stesse)
    var h = 7;
    for (var i = 0; i < 34; i++) {
      h = (h * 9301 + 49297) % 233280; var r = 14 + (h / 233280) * 76;
      h = (h * 9301 + 49297) % 233280; var an = -84 + (h / 233280) * 168;
      h = (h * 9301 + 49297) % 233280; var rr = 0.35 + (h / 233280) * 0.9;
      var p = pt(r, an).split(",");
      s.push("<circle cx='" + p[0] + "' cy='" + p[1] + "' r='" + rr.toFixed(2) + "' fill='#fff' opacity='" + (0.35 + rr / 2).toFixed(2) + "'/>");
    }
    s.push("<path d='M28,104 A72,72 0 0 1 172,104' fill='none' stroke='#9d8cff' stroke-opacity='.35' stroke-width='.6' stroke-dasharray='2 3'/>",
      "<text x='100' y='70' text-anchor='middle' font-size='26' font-weight='900' fill='#9d8cff' opacity='.55'>?</text>",
      "</g></g>",
      "<g class='lu-g-lan' style='opacity:0'><g class='lu-lan-in'>",
      "<line x1='100' y1='104' x2='100' y2='16' stroke='#fff' stroke-opacity='.9' stroke-width='5' stroke-linecap='round'/>",
      "<line x1='100' y1='104' x2='100' y2='16' stroke='#ff2d55' stroke-width='2.8' stroke-linecap='round'/>",
      "<path d='M100,7.5 L95,18.5 L105,18.5 Z' fill='#ff2d55' stroke='#fff' stroke-width='.9' stroke-linejoin='round'/>",
      "</g></g>",
      "<rect x='-5' y='104.3' width='210' height='12' fill='#18123f'/>",
      "<line x1='0' y1='104.5' x2='200' y2='104.5' stroke='#9d8cff' stroke-width='.9'/>",
      "<circle cx='100' cy='104' r='8.6' fill='url(#luPerno)' stroke='#fff' stroke-width='1'/>",
      "<circle cx='97.6' cy='101.6' r='2' fill='#fff' opacity='.75'/>",
      "</svg>");
    return s.join("");
  }

  function creaQuadrante(t) {
    if (!SVG_Q) SVG_Q = svgQuadrante();
    var wrap = t.el("div", { class: "lu-dial" });
    wrap.innerHTML = SVG_Q;
    var svg = wrap.querySelector("svg");
    var gB = svg.querySelector(".lu-g-bers"), gT = svg.querySelector(".lu-g-tenda"), gTi = svg.querySelector(".lu-tenda-in");
    var gL = svg.querySelector(".lu-g-lan"), gLi = svg.querySelector(".lu-lan-in");
    var sopra = t.el("div", { class: "lu-sopra" }), tag = t.el("div", { class: "lu-tag" }), pop = t.el("div", { class: "lu-pop" });
    sopra.appendChild(tag); sopra.appendChild(pop); wrap.appendChild(sopra);
    var Q = { nodo: wrap, v: 50, b: null, modo: null, fn: null, giu: false, mk: {}, tagTx: "", tenda: "chiusa", ultimo: 50, lanVis: false };
    var G = null;
    function geo() {
      if (G && G.w) return G;
      var w = wrap.clientWidth, h = wrap.clientHeight, s = Math.min((w || 300) / 200, (h || 170) / 112);
      G = { w: w, s: s, ox: ((w || 300) - 200 * s) / 2, oy: (h || 170) - 112 * s };
      return G;
    }
    function punto(v, r) { var g = geo(), a = (-90 + v * 1.8) * Math.PI / 180; return { x: g.ox + (100 + r * Math.sin(a)) * g.s, y: g.oy + (104 - r * Math.cos(a)) * g.s }; }
    function rot(v) { return "rotate(" + (v * 1.8 - 90).toFixed(2) + "deg)"; }
    function sposta(n, p, sc) { n.style.transform = "translate(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px) translate(-50%,-50%)" + (sc != null ? " scale(" + sc + ")" : ""); }
    function posTag() { if (Q.tagTx) sposta(tag, punto(Q.v, 62)); }
    Q.lan = function (v, liscia) { Q.v = v; gL.classList.toggle("liscia", !!liscia); gL.style.transform = rot(v); posTag(); };
    Q.vediLan = function (si) { if (Q.lanVis === !!si) return; Q.lanVis = !!si; gL.style.opacity = si ? "1" : "0"; if (!si) Q.tag(null); };
    Q.bers = function (v) { Q.b = v; if (v == null) { gB.style.visibility = "hidden"; return; } gB.style.visibility = ""; gB.style.transform = rot(v); };
    // la tendina: "chiusa" (copre il bersaglio), "sbircia" (trasparente: il sensitivo), "aperta" (girata via)
    Q.tendina = function (stato, anim) {
      if (Q.tenda === stato) return;
      Q.tenda = stato;
      if (!anim) gT.classList.add("subito");
      gT.classList.toggle("sbircia", stato === "sbircia");
      gT.classList.toggle("aperta", stato === "aperta");
      if (!anim) { void gT.getBoundingClientRect(); requestAnimationFrame(function () { gT.classList.remove("subito"); }); }
    };
    Q.trema = function () { gTi.classList.remove("trema"); void gTi.getBoundingClientRect(); gTi.classList.add("trema"); };
    Q.vergogna = function () { gLi.classList.remove("vergogna"); void gLi.getBoundingClientRect(); gLi.classList.add("vergogna"); };
    Q.tag = function (testo) { testo = testo || ""; if (testo !== Q.tagTx) { Q.tagTx = testo; tag.textContent = testo; tag.classList.toggle("vis", !!testo); } posTag(); };
    // gli avatar sul bordo del quadrante (ognuno per sé)
    function posMk(m) { sposta(m, punto(m._v, m._r), m._sc); }
    Q.marker = function (id, v, src, opz) {
      opz = opz || {};
      var m = Q.mk[id];
      if (!m) {
        m = Q.mk[id] = t.el("div", { class: "lu-mk" });
        m._img = t.el("img", { alt: "" }); m._b = t.el("b");
        m.appendChild(m._img); m.appendChild(m._b); sopra.insertBefore(m, pop);
      }
      if (src && m._img.getAttribute("src") !== src) m._img.setAttribute("src", src);
      m._v = v; m._r = opz.r || 101; m._sc = null;
      var cl = "lu-mk" + (opz.cls ? " " + opz.cls : "");
      if (m.className !== cl) m.className = cl;
      tx(m._b, opz.testo || "");
      posMk(m);
      return m;
    };
    // un avatar che vola dal perno al suo posto sul bordo
    Q.vola = function (id, v, src, opz, ritardo) {
      Q.togli(id);
      var m = Q.marker(id, 50, src, opz); m.classList.add("subito");
      m._v = 50; m._r = 0; m._sc = 0.3; m.style.opacity = "0"; posMk(m);
      void m.offsetWidth;
      setTimeout(function () {
        if (!m.parentNode) return;
        m.classList.remove("subito"); m.style.opacity = "1"; m._v = v; m._r = (opz && opz.r) || 101; m._sc = null; posMk(m);
      }, ritardo || 30);
    };
    Q.togli = function (id) {
      if (id == null) { Object.keys(Q.mk).forEach(function (k) { Q.togli(k); }); return; }
      var m = Q.mk[id]; if (m && m.parentNode) m.parentNode.removeChild(m); delete Q.mk[id];
    };
    Q.pop = function (html, cls) {
      pop.className = "lu-pop"; pop.innerHTML = html || "";
      if (!html) return;
      void pop.offsetWidth; pop.className = "lu-pop vis" + (cls ? " " + cls : "");
    };
    Q.coriandoli = function () {
      var colori = ["#ff2d55", "#ffd43b", "#69db7c", "#4dabf7", "#b197fc", "#ff922b"];
      for (var i = 0; i < 18; i++) {
        var c = t.el("span", { class: "lu-cor" });
        var an = Math.random() * Math.PI, d = 70 + Math.random() * 90;
        c.style.background = colori[i % colori.length];
        c.style.setProperty("--dx", (Math.cos(an) * d * (Math.random() < 0.5 ? -1 : 1)).toFixed(0) + "px");
        c.style.setProperty("--dy", (-Math.sin(an) * d - 20).toFixed(0) + "px");
        c.style.setProperty("--r", (Math.random() * 720 - 360).toFixed(0) + "deg");
        c.style.animationDelay = (Math.random() * 0.15).toFixed(2) + "s";
        sopra.appendChild(c);
        (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1800); })(c);
      }
    };
    // trascinare la lancetta (o il bersaglio) col dito: l'angolo dal perno
    function valoreDa(e) {
      var r = wrap.getBoundingClientRect(), g = geo();
      var px = r.left + g.ox + 100 * g.s, py = r.top + g.oy + 104 * g.s;
      var dx = e.clientX - px, dy = py - e.clientY;
      var a = dy <= 0 ? (dx < 0 ? -90 : 90) : Math.atan2(dx, dy) * 180 / Math.PI;
      return valore((a + 90) / 1.8);
    }
    wrap.addEventListener("pointerdown", function (e) {
      if (!Q.modo || !Q.fn) return;
      e.preventDefault(); Q.giu = true;
      try { wrap.setPointerCapture(e.pointerId); } catch (x) {}
      Q.ultimo = valoreDa(e); Q.fn(Q.ultimo, "giu");
    });
    wrap.addEventListener("pointermove", function (e) {
      if (!Q.giu || !Q.modo || !Q.fn) return;
      e.preventDefault();
      var v = valoreDa(e); if (v === Q.ultimo) return;
      Q.ultimo = v; Q.fn(v, "muovi");
    });
    function su() { if (!Q.giu) return; Q.giu = false; if (Q.modo && Q.fn) Q.fn(Q.ultimo, "su"); }
    wrap.addEventListener("pointerup", su); wrap.addEventListener("pointercancel", su); wrap.addEventListener("lostpointercapture", su);
    Q.trascina = function (modo, fn) { Q.modo = modo; Q.fn = modo ? fn : null; wrap.classList.toggle("tocca", !!modo); if (!modo) Q.giu = false; };
    Q.lascia = function () { Q.giu = false; };   // (un altro ha preso la lancetta: il mio dito non la muove più)
    Q.misura = function () {
      G = null;
      // il quadrante non è mai più alto del necessario: lo spazio in più va intorno alla parola
      var mh = Math.round(wrap.clientWidth * 0.56) + 6;
      if (wrap.clientWidth && wrap._mh !== mh) { wrap._mh = mh; wrap.style.maxHeight = mh + "px"; G = null; }
      posTag(); Object.keys(Q.mk).forEach(function (k) { posMk(Q.mk[k]); }); };
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { if (!document.body.contains(wrap)) { ro.disconnect(); return; } Q.misura(); });
      ro.observe(wrap);
    }
    window.addEventListener("resize", function rim() {
      if (!document.body.contains(wrap)) { if (Q._visto) window.removeEventListener("resize", rim); return; }   // (lo schermo non c'è più)
      Q._visto = true; Q.misura();
    });
    return Q;
  }

  // =========================================================
  //  LO SCHELETRO DELLO SCHERMO (uguale online e sullo stesso telefono)
  // =========================================================
  function scheletro(t, onEsci) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("lu-piena");   // schermo intero: niente titolo, niente scorrimento
    var ui = { t: t, s: s };
    ui.Q = creaQuadrante(t);
    ui.esci = el("button", { class: "lu-esci", type: "button", "aria-label": "Esci", text: "‹", onclick: onEsci });
    ui.a = el("div", { class: "lu-box a" }); ui.aT = el("span"); ui.aN = el("b"); ui.a.appendChild(ui.aT); ui.a.appendChild(ui.aN);
    ui.b = el("div", { class: "lu-box b" }); ui.bT = el("span"); ui.bN = el("b"); ui.b.appendChild(ui.bT); ui.b.appendChild(ui.bN);
    ui.timer = el("div", { class: "lu-timer spento", html: "<svg viewBox='0 0 36 36'><circle cx='18' cy='18' r='15.5' class='f'/><circle cx='18' cy='18' r='15.5' class='p'/></svg><span></span>" });
    ui.timerP = ui.timer.querySelector(".p"); ui.timerN = ui.timer.querySelector("span");
    ui.turnoTx = el("small", { class: "lu-turno" });
    var barra = el("div", { class: "lu-barra" }, [ui.esci, ui.a, el("div", { class: "lu-centro" }, [ui.turnoTx, ui.timer]), ui.b]);
    ui.avImg = el("img", { alt: "" }); ui.av = el("div", { class: "lu-av" }, [ui.avImg]);
    ui.chi = el("b"); ui.sotto = el("span");
    var testa = el("div", { class: "lu-testa" }, [ui.av, el("div", { class: "lu-chi" }, [ui.chi, ui.sotto])]);
    ui.parola = el("div", { class: "lu-parola" });
    ui.sx = el("div", { class: "lu-est sx vuoto" }); ui.dx = el("div", { class: "lu-est dx vuoto" });
    ui.firma = el("div", { class: "lu-firma", text: "📝 della compagnia" });   // la scala l'ha scritta il vostro gruppo
    var estremi = el("div", { class: "lu-estremi" }, [ui.sx, ui.dx, ui.firma]);
    ui.gente = el("div", { class: "lu-gente" });
    ui.pan = el("div", { class: "lu-pan" });
    ui.fondo = el("div", { class: "lu-fondo" });
    ui.banner = el("div", { class: "lu-banner" });
    ui.root = el("div", { class: "lu" }, [barra, testa, ui.parola, ui.Q.nodo, estremi, ui.gente, ui.pan, ui.fondo, ui.banner]);
    s._contenuto.appendChild(ui.root);
    return ui;
  }
  function mettiParola(ui, testo, pensa) {
    var s = pensa ? testo : (testo ? "«" + testo + "»" : "");
    tx(ui.parola, s);
    var cl = "lu-parola" + (pensa ? " pensa" : (s.length > 20 ? " lunga" : s.length > 13 ? " media" : ""));
    if (ui.parola.className !== cl) ui.parola.className = cl;
  }
  function mettiScala(ui, scala, nostra) {
    tx(ui.sx, scala ? scala[0] : "…"); tx(ui.dx, scala ? scala[1] : "…");
    ui.sx.classList.toggle("vuoto", !scala); ui.dx.classList.toggle("vuoto", !scala);
    if (ui.firma) ui.firma.classList.toggle("vis", !!(scala && nostra));   // 📝 la piccola firma: scala scritta dal gruppo
  }
  function mettiAvatar(ui, om, nome) { var src = srcAvatar(om, nome); if (ui.avImg.getAttribute("src") !== src) ui.avImg.setAttribute("src", src); }
  function svuota(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function banner(ui, testo) {
    if (!ui || !testo) return;
    tx(ui.banner, testo); ui.banner.classList.add("vis");
    clearTimeout(ui.tBanner); ui.tBanner = setTimeout(function () { ui.banner.classList.remove("vis"); }, 2600);
  }
  // mentre si scrive (tastiera aperta) lo schermo è più basso: si nascondono i pezzi che non servono, così il campo e il tasto restano a vista
  function tastiera(ui, campo) {
    campo.addEventListener("focus", function () { ui.root.classList.add("scrive"); });
    campo.addEventListener("blur", function () { setTimeout(function () { if (document.activeElement !== campo) ui.root.classList.remove("scrive"); }, 150); });
  }
  // un tasto che risponde al primo tocco (pointerup), vibra solo al tocco
  function bottone(t, classe, testo, fn) {
    var b = t.el("button", { class: "lu-btn " + (classe || ""), type: "button", text: testo }), giu = false;
    b.addEventListener("pointerdown", function (e) { if (b.disabled) return; giu = true; e.preventDefault(); });
    b.addEventListener("pointerup", function (e) { if (!giu || b.disabled) return; giu = false; e.preventDefault(); try { SG.audioCtx && SG.audioCtx(); } catch (_) {} vibra(10); fn(); });
    b.addEventListener("pointercancel", function () { giu = false; });
    b.addEventListener("pointerleave", function () { giu = false; });
    b.addEventListener("click", function (e) { if (e.detail === 0 && !b.disabled) fn(); });   // (tastiera / lettore di schermo: il tocco è già passato da pointerup)
    return b;
  }
  // il cerchio del tempo
  function mettiTempo(ui, scade, attivo) {
    if (!scade) { ui.timer.classList.add("spento"); tx(ui.timerN, ""); ui.timerP.style.strokeDashoffset = "0"; return; }
    var resta = Math.max(0, scade - Date.now()), s = Math.ceil(resta / 1000), tot = ui.totTempo || 60;
    ui.timer.classList.remove("spento");
    tx(ui.timerN, String(s));
    ui.timerP.style.strokeDashoffset = (97.4 * (1 - lim(resta / (tot * 1000), 0, 1))).toFixed(1);
    ui.timer.classList.toggle("rosso", s <= 10);
    if (attivo && s <= 5 && s > 0 && ui.ultTic !== s) { ui.ultTic = s; suono("tic"); }
  }

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, partita: 0, pid: null, imp: impNorm(conNostre(t.impostazioni)), scalaN: false, pronti: [],
      players: [{ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost), sq: 0, punti: 0 }],
      guarda: [],   // chi guarda: { id, nome, omino, tardi } (tardi = arrivato a partita cominciata: entra alla prossima)
      formula: "squadre", sqPunti: [0, 0], turno: 0, turniTot: 0, ordine: [], idx: 0, punt: [0, 0], sqTurno: 0,
      sens: null, sensSq: -1, modo: "cosa", passo: null, sub: null, scala: null, parola: null, seg: null, bers: null, bozza: 50,
      lan: 50, lanN: 0, mano: null, manoT: 0, conferme: [], lanConf: 50, lanP: {}, toccati: {}, bloccati: [], lanPsporco: false, lanPultimo: 0,
      voti: {}, primo: null, scadenza: 0, pausa: false, restaPausa: 0, avviso: null, avvN: 0, rivela: null,
      spareggio: 0, stessa: false, inRimonta: false, stat: {}, storia: [], fine: null, mazzo: null, segFirma: null, ultFrase: {}, manoNo: {} };
    var rete = null, tic = null;
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function membri(s) { return H.players.filter(function (p) { return p.sq === s; }); }
    function presentiSq(s) { return membri(s).filter(function (p) { return !p.via; }); }
    function inGuarda(id) { return H.guarda.some(function (x) { return x.id === id; }); }
    function st(id) { return H.stat[id] || (H.stat[id] = { centri: 0, turniSensitivo: 0, scommesseGiuste: 0, centriDati: 0, ptDati: 0, nDati: 0 }); }
    function indovini() {   // chi indovina adesso (presenti)
      if (!H.sens) return [];
      return presenti().filter(function (p) { return p.id !== H.sens && (H.formula !== "squadre" || p.sq === H.sensSq); }).map(function (p) { return p.id; });
    }
    function scommettitori() { return H.formula !== "squadre" ? [] : presenti().filter(function (p) { return p.sq !== H.sensSq; }).map(function (p) { return p.id; }); }
    function serveOk() { return Math.floor(indovini().length / 2) + 1; }   // più della metà di chi indovina
    // «⏩ Avanti» dopo la rivelazione: più di metà di chi gioca ed è presente (chi guarda non conta)
    function servonoAv() { return Math.floor(presenti().length / 2) + 1; }
    function prontiVeri() { return H.pronti.filter(function (id) { var p = pById(id); return p && !p.via; }); }
    function avvisa(testo) { H.avviso = { n: ++H.avvN, tx: testo }; }
    function nomeDi(id) { var p = pById(id); return p ? p.nome : "…"; }

    // "⚙️ Regole" nella saletta: l'host cambia le impostazioni quando vuole (anche i temi)
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.imp = impNorm(conNostre(im)); bd(); };

    rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(true); },
      onErrore: function () {
        if (H.pronta) return;
        ferma(); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      onForse: function (id) {
        var p = pById(id); if (!p || p.forse) return;
        p.forse = true;
        if (H.fase === "gioco" && id === H.sens && H.passo === "sceglie" && !H.pausa) pausa();   // il sensitivo si ricollega: il tempo si ferma
        bd();
      },
      onTornato: function (id) { var p = pById(id); if (!p || !p.forse) return; p.forse = false; if (H.pausa && id === H.sens) riprendi(); bd(); },
      onAddio: function (id) {
        if (inGuarda(id)) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
        var p = pById(id); if (!p) return;
        p.forse = false;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
        p.via = true;   // a partita iniziata resta in classifica, ma non gioca più (se torna, ritrova il suo posto)
        if (H.fase !== "gioco") return bd();
        if (H.mano === id) H.mano = null;
        if (presenti().length < MIN) return fine();
        if (H.passo === "rivela") { if (H.pronti.length && prontiVeri().length >= servonoAv()) return avanti(); return bd(); }   // «⏩ Avanti»: ora può bastare chi resta
        if (id === H.sens && H.passo === "sceglie") return saltaTurno("🚪 " + p.nome + " è uscito: tocca al prossimo");
        if (H.passo === "indovina") {
          if (!indovini().length) return chiudiIndovina();
          if (H.formula === "squadre") { H.conferme = H.conferme.filter(function (x) { return x !== id; }); if (H.conferme.length && H.conferme.length >= serveOk()) return chiudiIndovina(); }
          else if (indovini().every(function (x) { return H.bloccati.indexOf(x) >= 0; })) return chiudiIndovina();
        }
        if (H.passo === "scommette") { var sc = scommettitori(); if (!sc.length || sc.every(function (x) { return H.voti[x]; })) return rivela(); }
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p = pById(id), nome = String(m.nome || "Amico").trim().slice(0, 16) || "Amico";
          // chi rientra (pagina ricaricata, telefono riacceso) ha lo STESSO id: ritrova il suo posto, la sua squadra e (se è il sensitivo) il bersaglio
          if (p) {
            p.forse = false; if (p.via && H.fase === "gioco") p.via = false;
            if (H.pausa && id === H.sens) riprendi();
            bd(true); mandaSegreto(true);
            // ognuno per sé: chi ricarica mentre indovina ritrova la sua lancetta dove l'aveva messa
            if (H.fase === "gioco" && H.passo === "indovina" && H.formula !== "squadre" && H.toccati[id] && H.lanP[id] != null) privato(id, { t: "tuaLan", v: H.lanP[id], k: chiaveTurno() });
            return;
          }
          if (inGuarda(id)) { bd(true); return; }
          // nella Sala gioca solo chi è stato scelto: gli altri entrano e guardano (col loro id nella foto)
          if (!t.puoSedersi(id, nome)) { H.guarda.push({ id: id, nome: nome }); bd(true); return; }
          if (H.fase === "lobby" && H.players.length < MAX) {
            H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino), sq: membri(0).length <= membri(1).length ? 0 : 1, punti: 0 });
            bd(); return;
          }
          // partita cominciata (o stanza piena): guarda ed entra alla prossima
          H.guarda.push({ id: id, nome: nome, omino: avatarValido(m.omino), tardi: H.fase !== "lobby" });
          bd(true); return;
        }
        mossa(id, m);
      }
    });
    if (!rete) return senzaRete(t);

    // ----- la "foto" per tutti: SEMPRE con gli id e con "fase"; MAI il bersaglio prima della rivelazione -----
    function resta() {
      if (H.pausa) return Math.max(1, Math.ceil(H.restaPausa / 1000));
      return H.scadenza ? Math.max(0, Math.ceil((H.scadenza - Date.now()) / 1000)) : 0;
    }
    function vm(conOmini) {
      var om = conOmini || H.fase !== "gioco";
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, pid: H.pid,
        formula: H.fase === "lobby" ? H.imp.formula : H.formula, traguardo: H.imp.traguardo, tempo: H.imp.tempo,
        players: H.players.map(function (p) { var x = { id: p.id, nome: p.nome, sq: p.sq, punti: p.punti, via: !!p.via, forse: !!p.forse }; if (om) x.omino = p.omino || null; return x; }),
        guarda: H.guarda.map(function (g) { return { id: g.id, nome: g.nome }; }),
        sqPunti: H.sqPunti.slice(), turno: H.turno, turniTot: H.turniTot, spareggio: H.spareggio,
        sens: H.sens, sensSq: H.sensSq, modo: H.modo, passo: H.passo, sub: H.sub, scala: H.scala, scalaN: !!H.scalaN, parola: H.parola,
        pronti: H.passo === "rivela" ? prontiVeri() : [], servonoAv: H.passo === "rivela" ? servonoAv() : 0,   // «⏩ Avanti» a maggioranza
        lan: H.lan, lanN: H.lanN, mano: H.mano, conferme: H.conferme.slice(), serve: H.fase === "gioco" ? serveOk() : 0, bloccati: H.bloccati.slice(),
        voti: H.voti, primo: H.primo, resta: resta(), pausa: H.pausa, avviso: H.avviso,
        rivela: H.passo === "rivela" ? H.rivela : null, fine: H.fase === "fine" ? H.fine : null };
    }
    function bd(conOmini) { var v = vm(conOmini); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); mandaSegreto(false); }
    // i messaggi veloci (lancetta, frasi): a tutti, e anche allo schermo dell'host
    function veloce(m) { rete.inviaVeloce(m); ricevi(t, m, cbHost); }
    // un messaggio per un telefono solo (il segreto del sensitivo, un avviso): inviaVeloce con "to", così non resta in stanza
    function privato(id, m) { if (id === "host") { ricevi(t, m, cbHost); return; } m.to = id; rete.inviaVeloce(m); }
    function chiaveTurno() { return H.partita + "|" + H.turno; }
    function segreto() {
      if (H.fase !== "gioco" || !H.sens || !H.seg) return null;
      var k = chiaveTurno();
      if (H.passo === "sceglie") {
        if (H.modo === "classico") return H.sub === "scala" ? { k: k, f: "scala", scale: H.seg.scale, nostre: H.seg.nostre || [], bers: H.bers } : { k: k, f: "indizio", bers: H.bers };
        return H.sub === "parola" ? { k: k, f: "parola", parole: H.seg.parole, altre: H.seg.altre } : { k: k, f: "piazza", bozza: H.bozza };
      }
      if (H.passo === "indovina" || H.passo === "scommette") return { k: k, f: "vedi", bers: H.bers };
      return null;
    }
    function mandaSegreto(forza) {
      var s = segreto(); if (!s) { H.segFirma = null; return; }
      var f = JSON.stringify(s.f === "piazza" ? { k: s.k, f: s.f } : s);
      if (!forza && f === H.segFirma) return;
      H.segFirma = f; privato(H.sens, Object.assign({ t: "segreto" }, s));
    }
    function ferma() { if (tic) { clearInterval(tic); tic = null; } }
    function pausa() { H.pausa = true; H.restaPausa = Math.max(5000, H.scadenza - Date.now()); H.scadenza = 0; }
    function riprendi() { H.pausa = false; H.scadenza = Date.now() + Math.max(10000, H.restaPausa); }

    // ----- la partita -----
    function distribuisci(lista) {
      mescola(lista).forEach(function (p, i) { p.sq = i % 2; });
    }
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      var n = H.players.length;
      H.avviso = null;
      H.formula = H.imp.formula === "solo" || n < 4 ? "solo" : "squadre";
      if (H.imp.formula === "squadre" && n < 4) avvisa("In " + n + " si gioca ognuno per sé: ognuno la sua lancetta!");
      if (H.formula === "squadre" && (membri(0).length < 2 || membri(1).length < 2)) distribuisci(H.players);
      H.fase = "gioco"; H.partita++; H.pid = nuovoId();
      H.sqPunti = [0, 0]; H.turno = 0; H.stat = {}; H.storia = []; H.spareggio = 0; H.stessa = false; H.inRimonta = false; H.fine = null;
      H.players.forEach(function (p) { p.punti = 0; });
      // il primo sensitivo è a sorte (non sempre l'host), poi si va in giro
      var giro0 = Math.floor(Math.random() * H.players.length);
      H.ordine = H.players.map(function (p) { return p.id; }); H.ordine = H.ordine.slice(giro0).concat(H.ordine.slice(0, giro0)); H.idx = 0;
      H.turniTot = H.formula === "solo" ? H.ordine.length * H.imp.giri : 0;
      H.punt = [Math.floor(Math.random() * 8), Math.floor(Math.random() * 8)]; H.sqTurno = Math.random() < 0.5 ? 0 : 1;
      H.mazzo = creaMazzo(H.imp);
      if (!tic) tic = setInterval(orologio, 200);
      nuovoTurno();
    }
    function prossimoSens() {
      if (H.formula === "squadre") {
        var s = H.sqTurno, m = membri(s);
        for (var i = 0; i < m.length; i++) { var p = m[(H.punt[s] + i) % m.length]; if (!p.via) { H.punt[s] = (H.punt[s] + i + 1) % m.length; return p; } }
        return null;
      }
      while (H.idx < H.turniTot) { var q = pById(H.ordine[H.idx % H.ordine.length]); H.idx++; if (q && !q.via) return q; }
      return null;
    }
    // prima di ogni turno: ci sono abbastanza persone? (squadre rifatte, o si passa a ognuno per sé)
    function controllaGente() {
      if (presenti().length < MIN) { fine(); return false; }
      if (H.formula !== "squadre" || (presentiSq(0).length >= 2 && presentiSq(1).length >= 2)) return true;
      var vivi = presenti();
      if (vivi.length >= 4) { distribuisci(vivi); H.punt = [0, 0]; avvisa("🔀 Mancava qualcuno: squadre rifatte"); return true; }
      H.formula = "solo"; H.ordine = vivi.map(function (p) { return p.id; }); H.idx = 0; H.turniTot = H.ordine.length;
      H.players.forEach(function (p) { p.punti = 0; });
      avvisa("Siete rimasti in " + vivi.length + ": si continua ognuno per sé");
      return true;
    }
    function nuovoTurno() {
      if (!controllaGente()) return;
      var p = prossimoSens();
      if (!p) return fine();
      H.turno++;
      H.inRimonta = H.stessa; H.stessa = false;
      H.sens = p.id; H.sensSq = p.sq; H.modo = modoDelTurno(H.imp.domande, H.turno);
      H.passo = "sceglie"; H.scala = null; H.parola = null; H.bers = null; H.bozza = 50; H.seg = {}; H.rivela = null; H.segFirma = null;
      H.lan = 50; H.mano = null; H.conferme = []; H.lanP = {}; H.toccati = {}; H.bloccati = []; H.voti = {}; H.primo = null; H.pausa = false; H.pronti = [];
      var nostra = H.mazzo.nostraOra();   // 📝 una scala scritta dal gruppo in questo turno?
      var sc = H.modo === "cosa" ? H.mazzo.scala("cosa", nostra) : null;
      H.scalaN = false;
      if (H.modo === "cosa" && sc) {
        H.sub = "parola"; H.scala = [sc.sx, sc.dx]; H.scalaN = !!sc.nostra; H.seg.sc = sc; H.seg.parole = H.mazzo.parole(sc, 3); H.seg.altre = false;
        H.scadenza = Date.now() + T_COSA * 1000;
      } else {
        H.modo = "classico"; H.sub = "scala";
        // Classico: due scale tra cui scegliere (con «Mescolate» una delle due è vostra; con «Solo le nostre» tutte e due, finché ci sono)
        var due = mescola([H.mazzo.scala("classico", nostra), H.mazzo.scala("classico", nostra && H.imp.nostreModo === "solo")].filter(Boolean));
        H.seg.due = due;
        H.seg.nostre = due.map(function (s) { return !!s.nostra; });
        H.seg.scale = due.map(function (s) { return [s.sx, s.dx]; });
        H.bers = 3 + Math.round(Math.random() * 94);
        H.scadenza = Date.now() + T_CLASSICO * 1000;
      }
      st(p.id).turniSensitivo++;
      if (p.forse) pausa();
      bd(true);
    }
    function vaiIndovina() {
      H.passo = "indovina"; H.sub = null; H.lan = 50; H.mano = null; H.conferme = []; H.lanP = {}; H.toccati = {}; H.bloccati = []; H.pausa = false;
      H.scadenza = Date.now() + H.imp.tempo * 1000;
      bd();
    }
    function chiudiIndovina() {
      if (H.passo !== "indovina") return;
      H.mano = null;
      if (H.formula === "squadre" && scommettitori().length) { H.passo = "scommette"; H.voti = {}; H.primo = null; H.scadenza = Date.now() + T_SCOMMESSA * 1000; return bd(); }
      rivela();
    }
    // le mosse (dell'host e degli amici)
    function mossa(id, m) {
      var p = pById(id);
      if (m.t === "frase") return frase(id, m.k);
      if (m.t === "squadra") { if (H.fase === "lobby" && p) { p.sq = m.s === 1 ? 1 : 0; bd(); } return; }
      if (H.fase !== "gioco" || !p || p.via) return;   // chi guarda soltanto non fa mosse
      // «⏩ Avanti» dopo la rivelazione: vale solo per questa rivelazione (k); più di metà → si parte subito
      if (m.t === "avanti") {
        if (H.passo !== "rivela" || m.k !== chiaveTurno()) return;
        if (H.pronti.indexOf(id) < 0) H.pronti.push(id);
        if (prontiVeri().length >= servonoAv()) return avanti();
        return bd();
      }
      if (H.passo === "sceglie") {
        if (id !== H.sens || H.pausa) return;
        if (H.modo === "classico") {
          if (m.t === "scala" && H.sub === "scala") {
            var si = m.i === 1 && H.seg.scale[1] ? 1 : 0;
            H.scala = H.seg.scale[si]; H.scalaN = !!(H.seg.nostre || [])[si]; H.sub = "indizio";
            (H.seg.due || []).forEach(function (s, j) { if (j !== si) H.mazzo.libera(s); });   // la scala vostra non scelta può tornare
            return bd();
          }
          if (m.t === "indizio" && H.sub === "indizio") {
            var tx1 = pulisci(m.testo); if (!tx1) return;
            if (indizioVietato(tx1, H.scala)) return privato(id, { t: "avviso", tx: "Non puoi usare le parole della scala!" });
            H.parola = tx1; return vaiIndovina();
          }
          return;
        }
        if (m.t === "parola" && H.sub === "parola") {
          var scritta = typeof m.testo === "string", w = scritta ? pulisci(m.testo) : (H.seg.parole || [])[m.i | 0];
          if (!w) return;
          if (scritta && indizioVietato(w, H.scala)) return privato(id, { t: "avviso", tx: "Non puoi usare le parole della scala!" });
          H.parola = w; H.sub = "piazza"; H.bozza = 50; return bd();
        }
        if (m.t === "altre" && H.sub === "parola" && !H.seg.altre) {
          var nuove = H.mazzo.parole(H.seg.sc, 3);
          if (nuove.length) H.seg.parole = nuove;
          H.seg.altre = true; mandaSegreto(true); return;
        }
        if (m.t === "bozza" && H.sub === "piazza") { H.bozza = valore(m.v); return; }
        if (m.t === "piazza" && H.sub === "piazza") { H.bers = valore(m.v); return vaiIndovina(); }
        return;
      }
      if (H.passo === "indovina") {
        if (indovini().indexOf(id) < 0) return;
        if (H.formula === "squadre") {
          if (m.t === "lan") return muoviLan(id, valore(m.v));
          if (m.t === "lascio") { if (H.mano === id) { H.mano = null; bd(); } return; }
          if (m.t === "ok") {
            var i = H.conferme.indexOf(id);
            if (m.si === false) { if (i >= 0) H.conferme.splice(i, 1); }
            else if (i < 0) { if (!H.conferme.length) H.lanConf = H.lan; H.conferme.push(id); }
            if (H.conferme.length >= serveOk()) return chiudiIndovina();
            return bd();
          }
          return;
        }
        if (H.bloccati.indexOf(id) >= 0) return;
        if (m.t === "punta") { H.lanP[id] = valore(m.v); H.toccati[id] = true; H.lanPsporco = true; return; }
        if (m.t === "blocca") {
          H.lanP[id] = valore(m.v); H.toccati[id] = true; H.bloccati.push(id); H.lanPsporco = true;
          if (indovini().every(function (x) { return H.bloccati.indexOf(x) >= 0; })) return chiudiIndovina();
          return bd();
        }
        return;
      }
      if (H.passo === "scommette" && m.t === "scommessa" && scommettitori().indexOf(id) >= 0) {
        H.voti[id] = m.lato === "dx" ? "dx" : "sx";
        if (!H.primo) H.primo = id;
        if (scommettitori().every(function (x) { return H.voti[x]; })) return rivela();
        bd();
      }
    }
    // la lancetta comune: chi la tocca "prende la mano" (se è libera, o se chi l'aveva è fermo da più di 1,5 s)
    function muoviLan(id, v) {
      var ora = Date.now();
      if (H.mano && H.mano !== id && ora - H.manoT < MANO_MS) {
        // la tiene un altro: al telefono di chi ha provato a muoverla si dice chi la tiene, e la lancetta torna dov'è davvero
        if (ora - (H.manoNo[id] || 0) > 300) { H.manoNo[id] = ora; privato(id, { t: "lanNo", v: H.lan, chi: H.mano, k: chiaveTurno() }); }
        return;
      }
      H.mano = id; H.manoT = ora; H.lan = v; H.lanN++;
      veloce({ t: "lan", v: v, chi: id, n: H.lanN, k: chiaveTurno() });
      if (H.conferme.length && Math.abs(v - H.lanConf) > 0.5) {   // qualcuno sposta: le conferme si spengono
        H.conferme = []; avvisa("✋ " + nomeDi(id) + " ha spostato: confermate di nuovo"); bd();
      }
    }
    function frase(id, k) {
      k = k | 0; if (k < 0 || k >= FRASI.length) return;
      if (!pById(id) && !inGuarda(id)) return;
      if (H.fase === "gioco" && id === H.sens && (H.passo === "indovina" || H.passo === "scommette")) return;   // il sensitivo è muto
      var ora = Date.now(); if (ora - (H.ultFrase[id] || 0) < 1200) return; H.ultFrase[id] = ora;
      veloce({ t: "frase", chi: id, k: k });
    }
    function rivela() {
      if (H.passo !== "indovina" && H.passo !== "scommette") return;
      var R = { bers: H.bers, modo: H.modo, scala: H.scala, parola: H.parola, sens: H.sens, nome: nomeDi(H.sens) };
      if (H.formula === "squadre") {
        var pt = puntiDi(H.lan, H.bers), altra = 1 - H.sensSq;
        R.lan = H.lan; R.pt = pt; R.sq = H.sensSq; R.tele = Math.abs(H.lan - H.bers) < 0.5;
        H.sqPunti[H.sensSq] += pt;
        var nsx = 0, ndx = 0;
        Object.keys(H.voti).forEach(function (k) { if (H.voti[k] === "sx") nsx++; else ndx++; });
        var lato = nsx > ndx ? "sx" : ndx > nsx ? "dx" : (H.primo ? H.voti[H.primo] : null);
        if (lato) {
          var giusta = pt < 4 && (lato === "sx" ? H.bers < H.lan : H.bers > H.lan);
          R.scom = { lato: lato, giusta: giusta, sq: altra, pari: nsx === ndx };
          if (giusta) { H.sqPunti[altra]++; Object.keys(H.voti).forEach(function (k) { st(k).scommesseGiuste++; }); }
        }
        if (pt === 4) { indovini().forEach(function (id) { st(id).centri++; }); st(H.sens).centriDati++; }
        st(H.sens).ptDati += pt; st(H.sens).nDati++;
        // rimonta: centro e ancora dietro → la stessa squadra rigioca (una volta sola di fila, mai nello spareggio)
        R.rimonta = pt === 4 && !H.spareggio && !H.inRimonta && H.sqPunti[H.sensSq] < H.sqPunti[altra];
        if (R.rimonta) H.stessa = true;
        H.storia.push({ nome: R.nome, modo: H.modo, parola: H.parola, scala: H.scala, bers: H.bers, err: Math.abs(H.lan - H.bers) });
        var a = H.sqPunti[0], b = H.sqPunti[1], tr = H.imp.traguardo;
        R.ultimo = H.spareggio === 1 || (!H.spareggio && (a >= tr || b >= tr) && a !== b);
      } else {
        var pts = {}, lanP = {}, somma = 0, n = 0, errS = 0, centro = false;
        indovini().forEach(function (id) {
          if (!H.toccati[id]) { pts[id] = 0; return; }   // chi non ha mai toccato la lancetta: niente punti
          var v = H.lanP[id], q = puntiDi(v, H.bers);
          lanP[id] = v; pts[id] = q; somma += q; n++; errS += Math.abs(v - H.bers);
          if (q === 4) { st(id).centri++; centro = true; }
        });
        var media = n ? Math.round(somma / n) : 0;   // il sensitivo prende la media di chi ha indovinato
        pts[H.sens] = media;
        Object.keys(pts).forEach(function (id) { var q = pById(id); if (q) q.punti += pts[id]; });
        if (centro) st(H.sens).centriDati++;
        st(H.sens).ptDati += media; st(H.sens).nDati++;
        R.lanP = lanP; R.pts = pts; R.media = media;
        if (n) H.storia.push({ nome: R.nome, modo: H.modo, parola: H.parola, scala: H.scala, bers: H.bers, err: errS / n });
        R.ultimo = H.idx >= H.turniTot;
      }
      H.passo = "rivela"; H.rivela = R; H.scadenza = Date.now() + T_RIVELA * 1000; H.mano = null; H.pausa = false; H.pronti = [];
      bd();
    }
    function saltaTurno(testo) {
      if (H.passo === "sceglie" && H.sub === "scala" && H.seg && H.seg.due) H.seg.due.forEach(function (s) { H.mazzo.libera(s); });   // (le scale vostre non giocate tornano)
      H.pronti = [];
      H.passo = "rivela"; H.rivela = { saltato: testo, ultimo: H.formula === "solo" && H.idx >= H.turniTot };
      H.scadenza = Date.now() + T_SALTA * 1000; H.pausa = false; H.mano = null;
      bd();
    }
    function scaduto() {
      H.scadenza = 0;
      if (H.passo === "sceglie") {
        if (H.modo === "cosa" && H.sub === "piazza") { H.bers = H.bozza; return vaiIndovina(); }   // la parola c'è: vale dove ha lasciato il bersaglio
        return saltaTurno("⏰ " + nomeDi(H.sens) + (H.modo === "classico" ? " non ha scritto l'indizio" : " non ha scelto la parola") + ": tocca al prossimo");
      }
      if (H.passo === "indovina") return chiudiIndovina();
      if (H.passo === "scommette") return rivela();
    }
    // dopo la rivelazione: si va avanti col tasto dell'host o da soli (t.contoAvanti sul tasto)
    function avanti() {
      if (H.fase !== "gioco" || H.passo !== "rivela") return;
      if (H.formula === "squadre") {
        var a = H.sqPunti[0], b = H.sqPunti[1], tr = H.imp.traguardo;
        if (H.spareggio) { H.spareggio--; if (!H.spareggio) return fine(); }
        else if (a >= tr || b >= tr) {
          if (a !== b) return fine();
          H.spareggio = 2; avvisa("⚖️ Pari al traguardo! Spareggio: un turno a squadra");
        }
        if (H.turno >= 80) return fine();
        if (!H.stessa) H.sqTurno = 1 - H.sqTurno;
      } else if (H.idx >= H.turniTot) return fine();
      nuovoTurno();
    }
    function orologio() {
      if (H.fase !== "gioco") return;
      var ora = Date.now();
      if (H.mano && ora - H.manoT > MANO_MS) { H.mano = null; bd(); }
      if (H.lanPsporco && ora - H.lanPultimo >= 200) { H.lanPsporco = false; H.lanPultimo = ora; veloce({ t: "lanP", k: chiaveTurno(), p: H.lanP, b: H.bloccati.slice() }); }
      if (!H.pausa && H.scadenza && ora >= H.scadenza && H.passo !== "rivela") scaduto();
    }
    function premi() {
      var x = [], best = null, mg = null, ff = null, op = null;
      H.players.forEach(function (p) {
        var s = st(p.id);
        if (s.centri > 0 && (!best || s.centri > best.n)) best = { nome: p.nome, n: s.centri };
        if (s.nDati) {
          var m = s.ptDati / s.nDati;
          if (m >= 2 && (!mg || m > mg.m)) mg = { nome: p.nome, m: m };
          if (m < 2 && (!ff || m < ff.m)) ff = { nome: p.nome, m: m };
        }
      });
      if (best) x.push("🎯 Cecchino: " + best.nome + " (" + (best.n === 1 ? "1 centro" : best.n + " centri") + ")");
      if (mg) x.push("🧠 Mente gemella: " + mg.nome + ", il sensitivo più chiaro");
      H.storia.forEach(function (s) { if (s.modo === "cosa" && s.err >= 25 && (!op || s.err > op.err)) op = s; });
      if (op) x.push("😱 L'opinione più strana. Per " + op.nome + ": " + op.parola + " → " + doveSta(op.bers, op.scala));
      if (x.length < 3 && ff && (!mg || ff.nome !== mg.nome)) x.push("📻 Fuori frequenza: " + ff.nome + " (detto con affetto)");
      return x.slice(0, 3);
    }
    function fine() {
      H.scadenza = 0; H.mano = null; H.pausa = false;
      var cl, vinc = -1;
      if (H.formula === "squadre") {
        vinc = H.sqPunti[0] === H.sqPunti[1] ? -1 : (H.sqPunti[0] > H.sqPunti[1] ? 0 : 1);
        var primi = vinc < 0 ? H.players.length : membri(vinc).length;
        cl = H.players.map(function (p) { return { id: p.id, nome: p.nome, sq: p.sq, punti: H.sqPunti[p.sq], pos: (vinc < 0 || p.sq === vinc) ? 1 : primi + 1 }; })
          .sort(function (a, b) { return a.pos - b.pos || a.sq - b.sq; });
      } else {
        var ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
        cl = ord.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length }; });
      }
      var stat = {};
      H.players.forEach(function (p) {
        var s = st(p.id), r = cl.filter(function (x) { return x.id === p.id; })[0];
        stat[p.id] = { centri: s.centri, turniSensitivo: s.turniSensitivo, scommesseGiuste: s.scommesseGiuste, centriDati: s.centriDati,
          vittorie: r && r.pos === 1 && !(H.formula === "squadre" && vinc < 0) ? 1 : 0 };
      });
      H.fine = { formula: H.formula, vinc: vinc, sqPunti: H.sqPunti.slice(), classifica: cl, premi: premi(), stat: stat };
      H.fase = "fine"; H.passo = null; H.sens = null;
      if (H.mazzo) H.mazzo.salva();
      bd(true);
      // torneo, Classifica della serata e XP: i NOMI dei giocatori col loro posto (a squadre: chi vince al posto 1)
      if (t.risultato) t.risultato(cl.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici, tutti nella saletta (chi era arrivato tardi entra adesso)
    function nuova() {
      if (H.fase !== "fine") return;
      H.fase = "lobby"; H.passo = null; H.fine = null; H.sens = null; H.scadenza = 0; H.avviso = null;
      H.players = presenti(); H.players.forEach(function (p) { p.punti = 0; p.forse = false; });
      H.guarda = H.guarda.filter(function (g) {
        if (g.tardi && H.players.length < MAX && t.puoSedersi(g.id, g.nome)) {
          H.players.push({ id: g.id, nome: g.nome, omino: g.omino || null, sq: membri(0).length <= membri(1).length ? 0 : 1, punti: 0 });
          return false;
        }
        return true;
      });
      if (H.players.length >= 4 && (membri(0).length < 2 || membri(1).length < 2)) distribuisci(H.players);
      bd();
    }
    t.onRivincita = nuova;

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova, avantiOra: avanti,
      onAvanti: function (k) { mossa("host", { t: "avanti", k: k }); },   // il mio «⏩ Avanti» conta come quello degli altri
      invia: function (m) { mossa("host", m); },
      sposta: function (id, s) { if (H.fase !== "lobby") return; var p = pById(id); if (p) { p.sq = s === 1 ? 1 : 0; bd(); } },
      aCaso: function () { if (H.fase !== "lobby") return; distribuisci(H.players); bd(); },
      onEsci: function () {
        function via() { ferma(); rete.chiudi(); t.esci(); }
        // (dalla saletta il core ha già chiesto "Chiudere la stanza per tutti?")
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla Sala.", "Chiudi", via);
        via();
      } };
    bd();
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null };
    var cb = { sonoHost: false, myId: null,
      invia: function (m) { if (S.rete) S.rete.invia(m); },
      onAvanti: function (k) { if (S.rete) S.rete.invia({ t: "avanti", k: k }); },
      sposta: function (id, s) { if (id === S.myId && S.rete) S.rete.invia({ t: "squadra", s: s }); },
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (S.vm && S.vm.fase === "gioco") return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "📡", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
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
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
          else ricevi(t, m, cb);
        },
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "📡", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO ONLINE (uguale per host e ospiti): saletta, gioco, fine
  // =========================================================
  var UI = null;    // la schermata di gioco si costruisce UNA volta e poi si aggiorna a pezzi
  var FIN = null;   // la classifica finale già a schermo: le foto dopo non la ridisegnano
  var SEG = null;   // il segreto del sensitivo (bersaglio, scale, parole): arriva solo al suo telefono
  var MIALAN = null;   // ognuno per sé: la mia lancetta di questo turno, se ho ricaricato la pagina (me la ridà l'host)
  var BOX = null;   // il riquadro delle squadre in saletta
  function disegna(t, vm, cb) {
    if (vm.fase === "lobby") { UI = FIN = null; SEG = null; return lobby(t, vm, cb); }
    BOX = null;
    if (vm.fase === "fine") {
      UI = null;
      var kf = "fine|" + vm.partita;
      if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
      FIN = { k: kf, t: t, s: finale(t, vm, cb) };
      salvaStat(t, cb.myId, vm);
      return;
    }
    FIN = null;
    if (!UI || UI.t !== t || !document.body.contains(UI.s)) UI = creaSchermo(t, cb);
    UI.vm = vm;
    aggiorna(UI, vm, cb);
  }
  // i messaggi veloci: la lancetta comune, le lancette di ognuno, le frasi, il segreto, gli avvisi
  function ricevi(t, m, cb) {
    if (m.t === "tuaLan") { MIALAN = m; if (UI && UI.vm && UI.t === t) aggiorna(UI, UI.vm, cb); return; }
    if (m.t === "segreto") { SEG = m; if (UI && UI.vm && UI.t === t) aggiorna(UI, UI.vm, cb); return; }
    if (!UI || !UI.vm || UI.t !== t) return;
    if (m.t === "lan") lanRemota(UI, m, cb);
    else if (m.t === "lanNo") lanNegata(UI, m, cb);
    else if (m.t === "lanP") lancetteDiTutti(UI, m, cb);
    else if (m.t === "frase") fumetto(UI, m);
    else if (m.t === "avviso") banner(UI, m.tx);
  }

  // ----- saletta: quella comune, con le squadre se si gioca a squadre -----
  function boxSquadre(t, o) {
    var box = t.el("div", { class: "lu-squad-box" }), firma = "";
    box.aggiorna = function (giocatori, mioId, host) {
      var f = JSON.stringify([giocatori.map(function (p) { return p.id + ":" + p.nome + ":" + p.sq; }), mioId, host]);
      if (f === firma) return;
      firma = f; svuota(box);
      var testa = t.el("div", { class: "lu-sq-testa" });
      if (host) testa.appendChild(t.el("button", { class: "lu-casuale", type: "button", text: "🔀 A caso", onclick: o.aCaso }));
      var dentro = host || giocatori.some(function (p) { return p.id === mioId; });
      testa.appendChild(t.el("div", { class: "lu-sq-nota", text: host ? "Tocca un nome per spostarlo nell'altra squadra." : dentro ? "Tocca il tuo nome o «Vai qui» per cambiare squadra." : "Le squadre di questa partita." }));
      box.appendChild(testa);
      [0, 1].forEach(function (s) {
        var r = t.el("div", { class: "lu-squad-lista " + (s ? "b" : "a") });
        var membri = giocatori.filter(function (p) { return (p.sq === 1 ? 1 : 0) === s; });
        r.appendChild(t.el("b", { text: SQ[s] + " · " + membri.length }));
        membri.forEach(function (p) {
          var tu = p.id === mioId;
          r.appendChild(t.el("button", { class: "lu-scelta " + (s ? "b" : "a") + (tu ? " tu" : ""), type: "button", text: tu ? "Tu" : p.nome,
            onclick: function () { if (host || tu) o.sposta(p.id, 1 - s); } }));
        });
        var mio = giocatori.filter(function (p) { return p.id === mioId; })[0];
        if (!host && mio && (mio.sq === 1 ? 1 : 0) !== s) r.appendChild(t.el("button", { class: "lu-entra-sq", type: "button", text: "+ Vai qui", onclick: function () { o.sposta(mioId, s); } }));
        box.appendChild(r);
      });
    };
    return box;
  }
  function lobby(t, vm, cb) {
    stile();
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
    var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
    var n = vm.players.length, squadre = vm.formula === "squadre";
    var extra = [];
    if (squadre && n >= 4) {
      if (!BOX || BOX.t !== t) { BOX = boxSquadre(t, { aCaso: cb.aCaso, sposta: cb.sposta }); BOX.t = t; }
      BOX.aggiorna(vm.players, cb.myId, cb.sonoHost);
      extra.push(BOX);
    }
    if (guardano.length) extra.push(t.el("p", { class: "modulo-nota", text: "👀 Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
    var piccola = squadre && n >= 4 && (vm.players.filter(function (p) { return p.sq !== 1; }).length < 2 || vm.players.filter(function (p) { return p.sq === 1; }).length < 2);
    var nota = n < MIN ? null : piccola ? "Ogni squadra deve avere almeno 2 persone: sposta qualcuno o fai «🔀 A caso»."
      : (squadre && n < 4 ? "In meno di 4 si gioca ognuno per sé (con 4 o più, a squadre)." : null);
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - n),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: extra, puoComincia: !piccola, nota: cb.sonoHost ? nota : undefined,
      spettatore: guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !dentro && n >= MAX ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: guardo ? "Si parte quando l'host dà il via: tu guardi la partita." : (squadre && n >= 4 ? "Scegli la tua squadra. Si parte quando l'host dà il via!" : "Aspetta che l'host cominci!"),
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  // ----- la schermata di gioco -----
  function creaSchermo(t, cb) {
    var ui = scheletro(t, cb.onEsci);
    ui.cb = cb; ui.vm = null; ui.kTurno = null; ui.kPan = null; ui.kRiv = null; ui.kTimer = null; ui.scade = 0;
    ui.drag = false; ui.lastN = 0; ui.inviato = null; ui.ultInvio = 0; ui.anim = false; ui.lanP = {}; ui.bloccP = [];
    ui.manoVista = null; ui.kGente = ""; ui.avvN = null; ui.bozza = 50; ui.kBozza = null; ui.scrivo = false; ui.toccato = false; ui.mioLan = 50;
    // in fondo: le faccine (il mio avatar le fa sui telefoni di tutti) e le frasi veloci
    ui.fac = t.faccine();
    ui.bFrasi = t.el("button", { class: "lu-frasi-b", type: "button", "aria-label": "Frasi veloci", text: "💬", onclick: function () { apriFrasi(ui); } });
    ui.muto = t.el("div", { class: "lu-muto", text: "🤐 Muto come un pesce: non puoi aiutarli!" });
    if (ui.fac) ui.fondo.appendChild(ui.fac);
    ui.fondo.appendChild(ui.bFrasi); ui.fondo.appendChild(ui.muto);
    t.mostra(ui.s);
    ui.Q.misura();
    ui.tic = setInterval(function () {
      if (!document.body.contains(ui.s)) { clearInterval(ui.tic); return; }
      var v = ui.vm; if (!v) return;
      if (v.passo === "rivela" || v.pausa) return;
      mettiTempo(ui, ui.scade, ruolo(ui, v).attivo);
      // la targhetta "✋ Luca" sparisce se la lancetta è ferma da un po'
      if (ui.manoVista && Date.now() - ui.manoVista > 1700 && !v.mano) { ui.manoVista = null; ui.Q.tag(null); }
      // la lancetta comune: a dito staccato, se il mio telefono la mostra in un posto diverso dall'ultimo che ha deciso l'host, torna lì
      if (v.formula === "squadre" && v.passo === "indovina" && !ui.drag && ui.confV != null && Date.now() - (ui.suT || 0) > 600 && Math.abs(ui.Q.v - ui.confV) > 0.25) ui.Q.lan(ui.confV, true);
    }, 250);
    return ui;
  }
  function apriFrasi(ui) {
    if (ui.menuFrasi) { chiudiFrasi(ui); return; }
    var t = ui.t, m = t.el("div", { class: "lu-frasi" });
    FRASI.forEach(function (f, k) { m.appendChild(bottone(t, "grigio piccolo", f, function () { ui.cb.invia({ t: "frase", k: k }); chiudiFrasi(ui); })); });
    ui.root.appendChild(m); ui.menuFrasi = m;
  }
  function chiudiFrasi(ui) { if (ui.menuFrasi && ui.menuFrasi.parentNode) ui.menuFrasi.parentNode.removeChild(ui.menuFrasi); ui.menuFrasi = null; }
  function fumetto(ui, m) {
    var p = gioc(ui.vm, m.chi), g = (ui.vm.guarda || []).filter(function (x) { return x.id === m.chi; })[0];
    var nome = m.chi === ui.cb.myId ? "Tu" : (p ? p.nome : g ? g.nome : "…");
    var f = ui.t.el("div", { class: "lu-fum", text: nome + ": " + (FRASI[m.k] || "") });
    f.style.top = (22 + Math.random() * 22).toFixed(0) + "%";
    ui.root.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 2700);
  }
  function gioc(vm, id) { var l = (vm && vm.players) || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  // chi sono in questo turno
  function ruolo(ui, vm) {
    var myId = ui.cb.myId, io = gioc(vm, myId), guardo = !io || io.via, sq = vm.formula === "squadre";
    var sensIo = !guardo && vm.sens === myId;
    var indovino = !guardo && !sensIo && !!vm.sens && (!sq || io.sq === vm.sensSq);
    var scommetto = sq && !guardo && !sensIo && io.sq !== vm.sensSq;
    var bloccato = (vm.bloccati || []).indexOf(myId) >= 0;
    var attivo = (vm.passo === "sceglie" && sensIo) || (vm.passo === "indovina" && indovino && !bloccato) || (vm.passo === "scommette" && scommetto);
    return { io: io, guardo: guardo, sq: sq, sensIo: sensIo, indovino: indovino, scommetto: scommetto, bloccato: bloccato, attivo: attivo };
  }
  function aggiorna(ui, vm, cb) {
    var t = ui.t, Q = ui.Q, r = ruolo(ui, vm), kT = vm.partita + "|" + vm.turno;
    var sens = gioc(vm, vm.sens);
    // omini: la foto li porta solo ogni tanto (inizio turno, chi entra): si tengono
    ui.omini = ui.omini || {};
    vm.players.forEach(function (p) { if (p.omino !== undefined) ui.omini[p.id] = p.omino; });
    // ---- un turno nuovo: il quadrante torna com'era (la tendina si richiude girando) ----
    if (kT !== ui.kTurno) {
      var primo = ui.kTurno == null;
      ui.kTurno = kT; ui.kRiv = null; ui.lastN = 0; ui.confV = null; ui.drag = false; ui.scrivo = false; ui.toccato = false; ui.inviato = null; ui.mioLan = 50;
      ui.lanP = {}; ui.bloccP = []; ui.manoVista = null; ui.anim = false; clearTimeout(ui.tLan); ui.tLan = null;
      Q.togli(); Q.pop(null); Q.tag(null); Q.trascina(null); Q.lan(50, false);
      ui.sx.classList.remove("ok", "no"); ui.dx.classList.remove("ok", "no");
      if (Q.tenda === "aperta" && !primo) {
        Q.tendina("chiusa", true);
        setTimeout(function () { if (ui.kTurno === kT && Q.tenda !== "aperta" && !(SEG && SEG.k === kT)) Q.bers(null); }, 1300);
      } else { Q.tendina("chiusa", false); Q.bers(null); }
    }
    // ---- in alto: punti e turno ----
    if (!ui.anim) mettiPunti(ui, vm, r);
    var turnoTesto = vm.formula === "squadre" ? (vm.spareggio ? "Spareggio" : "Turno " + vm.turno) : "Turno " + vm.turno + (vm.turniTot ? "/" + vm.turniTot : "");
    tx(ui.turnoTx, (r.guardo ? "👀 " : "") + turnoTesto);
    // ---- il sensitivo e la parola ----
    mettiAvatar(ui, sens ? ui.omini[sens.id] : null, sens ? sens.nome : "?");
    tx(ui.chi, sens ? "🔮 " + (r.sensIo ? "Tu sei il sensitivo" : sens.nome) + (r.sq ? " · Squadra " + SQ[vm.sensSq] : "") : "");
    tx(ui.sotto, sottotitolo(vm, r, sens));
    if (vm.parola) mettiParola(ui, vm.parola, false);
    else if (vm.passo === "sceglie") mettiParola(ui, r.sensIo ? (vm.modo === "classico" ? (vm.sub === "scala" ? "🤫 Solo tu vedi il bersaglio" : "✍️ Scrivi il tuo indizio") : "🤔 Scegli la parola") : "🔮 " + (sens ? sens.nome : "") + " sta pensando…", true);
    else mettiParola(ui, "", true);
    // ---- la scala ----
    var seg = r.sensIo && SEG && SEG.k === kT ? SEG : null;
    mettiScala(ui, vm.scala || (vm.rivela && vm.rivela.scala) || null, vm.scalaN);
    // ---- il tempo ----
    var kTim = kT + "|" + vm.passo + "|" + (vm.pausa ? "p" : "");
    var scade = Date.now() + (vm.resta || 0) * 1000;
    if (kTim !== ui.kTimer || Math.abs(scade - ui.scade) > 1600) {
      ui.kTimer = kTim; ui.scade = vm.resta ? scade : 0; ui.ultTic = null;
      ui.totTempo = vm.passo === "indovina" ? vm.tempo : vm.passo === "scommette" ? T_SCOMMESSA : vm.passo === "sceglie" ? (vm.modo === "classico" ? T_CLASSICO : T_COSA) : 0;
    }
    if (vm.pausa) { ui.timer.classList.remove("spento"); tx(ui.timerN, "📶"); ui.timer.classList.remove("rosso"); }
    else if (vm.passo === "rivela") mettiTempo(ui, 0);
    else mettiTempo(ui, ui.scade, false);
    // ---- un avviso per tutti ("Luca ha spostato: confermate di nuovo") ----
    if (vm.avviso && vm.avviso.n !== ui.avvN) { var nuovo = ui.avvN != null; ui.avvN = vm.avviso.n; if (nuovo || vm.passo !== "rivela") banner(ui, vm.avviso.tx); }
    // ---- il quadrante ----
    if (vm.passo === "rivela" && vm.rivela) rivelaOnline(ui, vm, r);
    else {
      if (r.sensIo && vm.modo === "cosa" && vm.sub === "piazza") {
        // dove l'avevo lasciato (se la pagina si è ricaricata, me lo ridà l'host col segreto)
        var conSeg = !!(seg && seg.f === "piazza" && seg.bozza != null);
        if (conSeg && ui.kBozza !== kT + "|s" && !ui.Q.giu) { ui.kBozza = kT + "|s"; ui.bozza = seg.bozza; }
        else if (ui.kBozza !== kT && ui.kBozza !== kT + "|s") { ui.kBozza = kT; ui.bozza = 50; }
        Q.bers(ui.bozza); Q.tendina("sbircia", false);
      } else if (seg && seg.bers != null) { Q.bers(seg.bers); Q.tendina("sbircia", true); }
      else if (Q.tenda !== "chiusa") Q.tendina("chiusa", true);
      var vediLan = vm.passo === "indovina" || vm.passo === "scommette" ? (r.sq || r.indovino) : false;
      Q.vediLan(vediLan);
      if (r.sq && vediLan && vm.lanN >= ui.lastN) { ui.lastN = vm.lanN; ui.confV = vm.lan; if (!ui.drag) Q.lan(vm.lan, true); }
      if (!r.sq && r.indovino && vm.passo === "indovina") {
        if (MIALAN && MIALAN.k === kT && !ui.toccato) { ui.toccato = true; ui.mioLan = valore(MIALAN.v); }
        Q.lan(ui.mioLan, false);
      }
      if (r.sq && vediLan && vm.passo !== "indovina") { ui.drag = false; ui.manoVista = null; Q.tag(null); }   // la lancetta è ferma: niente più «✋»
      else if (r.sq && vediLan) {
        if (vm.mano && vm.mano !== cb.myId) { var pm = gioc(vm, vm.mano); Q.tag("✋ " + (pm ? pm.nome : "…")); ui.manoVista = Date.now(); }
        else if (!vm.mano && !ui.drag && (!ui.manoVista || Date.now() - ui.manoVista > 1700)) Q.tag(null);
      }
      // ognuno per sé: chi non deve più indovinare vede le lancette degli altri in diretta
      if (!r.sq) {
        if (vm.passo === "indovina" && (!r.indovino || r.bloccato)) mettiLancette(ui, vm, r);
        else if (vm.passo !== "indovina") Q.togli();
      }
    }
    // ---- chi c'è (conferme, lucchetti, voti, punti) ----
    mettiGente(ui, vm, r);
    // ---- il pannello in basso (fatto una volta per turno e passo) ----
    pannello(ui, vm, r, seg);
    // ---- in fondo: il sensitivo è muto mentre gli altri indovinano ----
    var muto = r.sensIo && (vm.passo === "indovina" || vm.passo === "scommette");
    if (ui.fac) ui.fac.style.display = muto ? "none" : "";
    ui.bFrasi.style.display = muto ? "none" : "";
    ui.muto.style.display = muto ? "" : "none";
    if (muto) chiudiFrasi(ui);
  }
  function sottotitolo(vm, r, sens) {
    var nome = sens ? sens.nome : "";
    if (vm.pausa) return "📶 " + nome + " si ricollega… il tempo è fermo";
    if (vm.passo === "sceglie") {
      if (r.sensIo) return vm.modo === "classico" ? "🎯 Classico: inventa la parola giusta" : "🤔 Cosa ne pensi? Decidi tu dove sta";
      return vm.modo === "cosa" && vm.sub === "piazza" ? "Sta decidendo dove mettere questa parola:" : (vm.modo === "classico" ? "🎯 Classico: sta inventando l'indizio" : "🤔 Cosa ne pensi? Sta scegliendo la parola");
    }
    if (vm.passo === "indovina") {
      if (r.sensIo) return "Guarda gli altri cercare il tuo bersaglio…";
      if (r.sq) return r.indovino ? "Muovete la lancetta: dove l'ha messo " + nome + "?" : "👀 La Squadra " + SQ[vm.sensSq] + " sta decidendo";
      return r.indovino ? (r.bloccato ? "🔒 Bloccata! Aspetta gli altri" : "Muovi la tua lancetta: dove l'ha messo " + nome + "?") : "👀 Gli altri cercano il bersaglio";
    }
    if (vm.passo === "scommette") return r.scommetto ? "⬅️ Più a sinistra o più a destra? ➡️" : "La Squadra " + SQ[1 - vm.sensSq] + " scommette…";
    if (vm.passo === "rivela") return vm.rivela && vm.rivela.saltato ? "Turno saltato" : "🥁 Ecco dov'era!";
    return "";
  }
  function mettiPunti(ui, vm, r) {
    var my = r.io;
    if (vm.formula === "squadre") {
      ui.a.className = "lu-box a sq" + (my && my.sq === 0 && !r.guardo ? " mia" : "") + (vm.sensSq === 0 && vm.passo !== "rivela" ? " tocca" : "");
      ui.b.className = "lu-box b sq" + (my && my.sq === 1 && !r.guardo ? " mia" : "") + (vm.sensSq === 1 && vm.passo !== "rivela" ? " tocca" : "");
      tx(ui.aT, "Squadra A" + (my && my.sq === 0 && !r.guardo ? " · tu" : "")); tx(ui.aN, fmtN(vm.sqPunti[0]));
      tx(ui.bT, "Squadra B" + (my && my.sq === 1 && !r.guardo ? " · tu" : "")); tx(ui.bN, fmtN(vm.sqPunti[1]));
      return;
    }
    var ord = vm.players.slice().sort(function (a, b) { return b.punti - a.punti; }), primo = ord[0];
    ui.a.className = "lu-box a"; ui.b.className = "lu-box b";
    tx(ui.aT, "In testa"); tx(ui.aN, primo ? primo.nome.split(" ")[0] + " " + fmtN(primo.punti) : "");
    if (my && !r.guardo) { tx(ui.bT, "Tu · " + (1 + ord.filter(function (q) { return q.punti > my.punti; }).length) + "°"); tx(ui.bN, fmtN(my.punti)); }
    else { tx(ui.bT, "Guardi"); tx(ui.bN, "👀"); }
  }
  function mettiGente(ui, vm, r) {
    var t = ui.t, lista = [], myId = ui.cb.myId;
    vm.players.forEach(function (p) {
      var badge = "", cls = "";
      if (vm.formula === "squadre") {
        cls = p.sq === 1 ? "b" : "a";
        if (vm.passo === "indovina" && p.sq === vm.sensSq && p.id !== vm.sens) { if ((vm.conferme || []).indexOf(p.id) >= 0) { badge = "✅"; cls += " si"; } else if (vm.mano === p.id) badge = "✋"; }
        else if (vm.passo === "scommette" && p.sq !== vm.sensSq) { var vo = (vm.voti || {})[p.id]; badge = vo === "sx" ? "⬅️" : vo === "dx" ? "➡️" : "🤔"; if (vo) cls += " si"; }
        else if (vm.passo === "indovina" || vm.passo === "scommette") { if (vm.passo === "indovina" && p.sq !== vm.sensSq) return; if (vm.passo === "scommette" && p.sq === vm.sensSq) return; }
        if (p.id === vm.sens) { if (vm.passo === "indovina" || vm.passo === "scommette") return; badge = "🔮"; }
      } else {
        if (p.id === vm.sens) badge = "🔮";
        else if (vm.passo === "indovina" && (vm.bloccati || []).indexOf(p.id) >= 0) { badge = "🔒"; cls = "si"; }
        badge = badge + " " + fmtN(p.punti);
      }
      if (p.via || p.forse) cls += " via";
      if (p.id === myId) cls += " tu";
      lista.push({ id: p.id, nome: (p.forse ? "📶 " : "") + (p.id === myId ? "Tu" : p.nome), badge: badge, cls: cls });
    });
    var k = JSON.stringify(lista);
    if (k === ui.kGente) return;
    ui.kGente = k; svuota(ui.gente);
    lista.forEach(function (x) {
      ui.gente.appendChild(t.el("div", { class: "lu-p " + x.cls }, [t.el("img", { alt: "", src: srcAvatar(ui.omini[x.id], x.nome) }), t.el("span", { text: x.nome }), x.badge ? t.el("i", { text: x.badge }) : null]));
    });
  }
  // la lancetta comune che si muove (dal telefono di chi la tiene)
  function lanRemota(ui, m, cb) {
    var vm = ui.vm; if (!vm || m.k !== vm.partita + "|" + vm.turno || vm.passo !== "indovina") return;
    if (m.n <= ui.lastN) return;   // arrivato tardi: più vecchio di quello che ho
    ui.lastN = m.n; ui.confV = m.v;   // (l'ultima posizione decisa dall'host, anche se è la mia)
    if (m.chi === cb.myId) return;   // la mia lancetta: ce l'ho già sotto il dito
    if (ui.drag) { ui.drag = false; ui.Q.lascia(); }   // un altro ha preso la lancetta: il mio dito non la muove più
    ui.Q.lan(m.v, true);
    var p = gioc(vm, m.chi); ui.Q.tag("✋ " + (p ? p.nome : "…")); ui.manoVista = Date.now();
  }
  // ho provato a muovere la lancetta mentre la teneva un altro: il mio dito non conta, la lancetta torna dov'è davvero
  function lanNegata(ui, m, cb) {
    var vm = ui.vm; if (!vm || m.k !== vm.partita + "|" + vm.turno || vm.passo !== "indovina" || m.chi === cb.myId) return;
    ui.drag = false; ui.Q.lascia(); clearTimeout(ui.tLan); ui.tLan = null; ui.inviato = null; ui.confV = m.v;
    ui.Q.lan(m.v, true);
    var p = gioc(vm, m.chi); ui.Q.tag("✋ " + (p ? p.nome : "…")); ui.manoVista = Date.now();
  }
  // ognuno per sé: le lancette di tutti (le vede solo chi non deve più indovinare)
  function lancetteDiTutti(ui, m, cb) {
    var vm = ui.vm; if (!vm || m.k !== vm.partita + "|" + vm.turno || vm.passo !== "indovina") return;
    ui.lanP = m.p || {}; ui.bloccP = m.b || [];
    var r = ruolo(ui, vm);
    if (!r.indovino || r.bloccato) mettiLancette(ui, vm, r);
  }
  function mettiLancette(ui, vm, r) {
    var Q = ui.Q, bl = (vm.bloccati || []).concat(ui.bloccP || []);
    Object.keys(ui.lanP || {}).forEach(function (id) {
      var p = gioc(vm, id); if (!p) return;
      Q.marker(id, ui.lanP[id], srcAvatar(ui.omini[id], p.nome), { cls: bl.indexOf(id) >= 0 ? "ok" : "", testo: id === ui.cb.myId ? "Tu" : "" });
    });
  }
  // ----- il pannello in basso: si costruisce una volta per turno e passo, poi si aggiornano i numeri -----
  function tipoPannello(vm, r) {
    if (vm.pausa) return "pausa";
    if (vm.passo === "sceglie") return r.sensIo ? "s-" + vm.modo + "-" + vm.sub : "attesa";
    if (vm.passo === "indovina") return r.sq ? (r.indovino ? "sq-indovina" : "guarda") : (r.indovino ? (r.bloccato ? "solo-bloccato" : "solo-indovina") : "guarda");
    if (vm.passo === "scommette") return r.scommetto ? "scommetto" : "guarda";
    if (vm.passo === "rivela") return "rivela";
    return "vuoto";
  }
  function pannello(ui, vm, r, seg) {
    var t = ui.t, cb = ui.cb, Q = ui.Q, tipo = tipoPannello(vm, r);
    if (tipo === "s-cosa-parola" && ui.scrivo) tipo = "s-cosa-scrivo";
    var k = tipo + "|" + vm.partita + "|" + vm.turno + (tipo === "s-cosa-parola" && seg ? "|" + (seg.parole || []).join(",") : "") + (tipo === "s-classico-scala" ? "|" + !!seg : "");
    if (k !== ui.kPan) {
      ui.kPan = k; svuota(ui.pan); ui.panEl = {}; ui.root.classList.remove("scrive");
      var P = ui.panEl, el = t.el;
      // il dito sul quadrante: cosa muove (lancetta comune, la mia lancetta, il bersaglio) o niente
      Q.trascina(null);
      if (tipo === "s-classico-scala") {
        ui.pan.appendChild(el("div", { class: "lu-nota", text: "Scegli la scala che ti ispira di più:" }));
        ((seg && seg.scale) || []).forEach(function (sc, i) {
          ui.pan.appendChild(bottoneCarta(t, sc, function () { cb.invia({ t: "scala", i: i }); }, !!((seg && seg.nostre) || [])[i]));
        });
        if (!seg) ui.pan.appendChild(el("div", { class: "lu-nota", text: "Un attimo…" }));
      } else if (tipo === "s-classico-indizio") {
        P.campo = el("input", { class: "lu-campo", type: "text", maxlength: "30", placeholder: "Il tuo indizio (una parola o poche)", enterkeyhint: "send" });
        P.err = el("div", { class: "lu-nota lu-err" });
        var manda = function () {
          var v = pulisci(P.campo.value);
          if (!v) { tx(P.err, "Scrivi qualcosa!"); return; }
          if (indizioVietato(v, vm.scala)) { tx(P.err, "Non puoi usare le parole della scala!"); return; }
          cb.invia({ t: "indizio", testo: v });
        };
        P.campo.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); manda(); } });
        ui.pan.appendChild(P.campo); ui.pan.appendChild(P.err); tastiera(ui, P.campo);
        ui.pan.appendChild(bottone(t, "", "📣 Fatto", manda));
      } else if (tipo === "s-cosa-parola") {
        var g = el("div", { class: "lu-riga" });
        ((seg && seg.parole) || []).forEach(function (w, i) { g.appendChild(bottone(t, "viola parola", w, function () { cb.invia({ t: "parola", i: i }); })); });
        P.altre = bottone(t, "grigio piccolo", "🔄 Altre 3", function () { cb.invia({ t: "altre" }); P.altre.disabled = true; });
        P.altre.disabled = !seg || !!seg.altre;
        g.appendChild(P.altre);
        ui.pan.appendChild(g);
        ui.pan.appendChild(bottone(t, "grigio piccolo", "✏️ La scelgo io", function () { ui.scrivo = true; ui.kPan = null; aggiorna(ui, ui.vm, cb); }));
        if (!seg) ui.pan.appendChild(el("div", { class: "lu-nota", text: "Un attimo…" }));
      } else if (tipo === "s-cosa-scrivo") {
        P.campo = el("input", { class: "lu-campo", type: "text", maxlength: "30", placeholder: "La tua parola (es. Il mio capo)", enterkeyhint: "send" });
        P.err = el("div", { class: "lu-nota lu-err" });
        var manda2 = function () {
          var v = pulisci(P.campo.value);
          if (!v) { tx(P.err, "Scrivi qualcosa!"); return; }
          if (indizioVietato(v, vm.scala)) { tx(P.err, "Non puoi usare le parole della scala!"); return; }
          cb.invia({ t: "parola", testo: v });
        };
        P.campo.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); manda2(); } });
        ui.pan.appendChild(P.campo); ui.pan.appendChild(P.err); tastiera(ui, P.campo);
        ui.pan.appendChild(el("div", { class: "lu-riga" }, [bottone(t, "grigio", "‹ Le parole pronte", function () { ui.scrivo = false; ui.kPan = null; aggiorna(ui, ui.vm, cb); }), bottone(t, "", "OK ▶", manda2)]));
        setTimeout(function () { try { P.campo.focus(); } catch (e) {} }, 60);
      } else if (tipo === "s-cosa-piazza") {
        ui.pan.appendChild(el("div", { class: "lu-nota", text: "🤫 Trascina il bersaglio dove metti «" + vm.parola + "»" }));
        ui.pan.appendChild(bottone(t, "", "📍 Lo metto qui", function () { cb.invia({ t: "piazza", v: ui.bozza }); }));
        var ultB = 0;
        Q.trascina("bers", function (v, fase) {
          ui.bozza = v; Q.bers(v); ui.kBozza = ui.kTurno + "|s";   // (da qui conta il mio dito, non il segreto vecchio)
          var ora = Date.now(), manda = function () { clearTimeout(ui.tLan); ui.tLan = null; ultB = Date.now(); cb.invia({ t: "bozza", v: ui.bozza }); };
          if (fase === "su" || ora - ultB > 400) manda();
          else if (!ui.tLan) ui.tLan = setTimeout(manda, 400 - (ora - ultB));
        });
      } else if (tipo === "sq-indovina") {
        P.ok = bottone(t, "", "✅ Ci siamo", function () { var si = (ui.vm.conferme || []).indexOf(cb.myId) < 0; cb.invia({ t: "ok", si: si }); });
        P.nota = el("div", { class: "lu-nota" });
        ui.pan.appendChild(P.nota); ui.pan.appendChild(P.ok);
        Q.trascina("lan", function (v, fase) {
          if (fase === "giu") ui.drag = true;
          if (!ui.drag) return;   // (un altro ha preso la lancetta)
          Q.lan(v, false); Q.tag("✋ Tu"); ui.mioLan = v;
          // al massimo ogni 80 ms (e l'ultima posizione parte comunque, anche se il dito si ferma)
          var manda = function () { clearTimeout(ui.tLan); ui.tLan = null; if (ui.mioLan !== ui.inviato) { cb.invia({ t: "lan", v: ui.mioLan }); ui.inviato = ui.mioLan; ui.ultInvio = Date.now(); } };
          var ora = Date.now();
          if (fase === "su" || ora - ui.ultInvio >= 80) manda();
          else if (!ui.tLan) ui.tLan = setTimeout(function () { if (ui.drag) manda(); }, 80 - (ora - ui.ultInvio));
          if (fase === "su") { ui.drag = false; ui.suT = Date.now(); cb.invia({ t: "lascio" }); ui.manoVista = Date.now(); }
        });
      } else if (tipo === "solo-indovina") {
        P.nota = el("div", { class: "lu-nota", text: "Tocca o trascina sul quadrante, poi blocca." });
        P.ok = bottone(t, "", "🔒 Blocca qui", function () { if (!ui.toccato) { tx(P.nota, "Prima muovi la lancetta!"); return; } cb.invia({ t: "blocca", v: ui.mioLan }); });
        ui.pan.appendChild(P.nota); ui.pan.appendChild(P.ok);
        var ultP = 0;
        Q.vediLan(true);
        Q.trascina("lan", function (v, fase) {
          ui.toccato = true; ui.mioLan = v; Q.lan(v, false);
          var ora = Date.now(), manda = function () { clearTimeout(ui.tLan); ui.tLan = null; ultP = Date.now(); cb.invia({ t: "punta", v: ui.mioLan }); };
          if (fase === "su" || ora - ultP >= 150) manda();
          else if (!ui.tLan) ui.tLan = setTimeout(manda, 150 - (ora - ultP));
        });
      } else if (tipo === "solo-bloccato") {
        ui.pan.appendChild(el("div", { class: "lu-nota", text: "🔒 Bloccata! Adesso vedi dove mettono la lancetta gli altri." }));
      } else if (tipo === "scommetto") {
        P.sx = bottone(t, "blu", "⬅️ Più a sinistra", function () { cb.invia({ t: "scommessa", lato: "sx" }); });
        P.dx = bottone(t, "aran", "Più a destra ➡️", function () { cb.invia({ t: "scommessa", lato: "dx" }); });
        P.nota = el("div", { class: "lu-nota" });
        ui.pan.appendChild(P.nota); ui.pan.appendChild(el("div", { class: "lu-riga" }, [P.sx, P.dx]));
      } else if (tipo === "rivela") {
        var R = vm.rivela || {};
        P.esito = el("div", { class: "lu-esito" });
        righeEsito(t, P.esito, vm, R, cb.myId);
        ui.pan.appendChild(P.esito);
        var kc = "lu|" + vm.partita + "|" + vm.turno, kt = vm.partita + "|" + vm.turno;
        // il conto per tutti ("Si va avanti tra 8…"): a zero l'host va avanti da solo
        var p = el("p", { class: "lu-conto" });
        ui.pan.appendChild(p);
        t.contoAvanti(p, vm.resta || T_RIVELA, cb.sonoHost ? cb.avantiOra : null, kc);
        // «⏩ Avanti» a chi gioca: se lo tocca più di metà si parte subito; il mio tocco resta «✅ Avanti», cambia solo il numero
        if (!r.guardo) {
          P.avTx = el("span"); P.avN = el("span", { class: "lu-quanti" });
          P.av = bottone(t, "giallo", "", function () {
            if (P.av.disabled) return;
            ui.mioAv = kt; aggAvanti(ui, ui.vm, cb); cb.onAvanti(kt);
          });
          P.av.appendChild(P.avTx); P.av.appendChild(P.avN);
          P.avUltimo = !!R.ultimo;
          ui.pan.appendChild(P.av);
        }
      } else if (tipo === "pausa") {
        ui.pan.appendChild(el("div", { class: "lu-nota", text: "📶 Il sensitivo si sta ricollegando: il tempo è fermo. Se non torna, si passa al prossimo." }));
      } else if (tipo === "attesa") {
        ui.pan.appendChild(el("div", { class: "lu-nota", text: vm.scala ? "Intanto guardate la scala: preparatevi a discutere!" : "Il sensitivo sta scegliendo la scala…" }));
      } else if (tipo === "guarda") {
        var tg = r.sensIo ? (r.sq ? "Guarda la tua squadra cercare il bersaglio 🍿" : "Guarda dove mettono la lancetta gli altri 🍿") : r.guardo ? "👀 Guardi la partita: entri alla prossima." :
          vm.passo === "scommette" ? "Aspettate la scommessa della Squadra " + SQ[1 - vm.sensSq] + "…" :
          r.scommetto ? "Guardate la lancetta: tra poco scommettete voi, più a sinistra o più a destra!" : "Guarda la lancetta degli altri…";
        ui.pan.appendChild(el("div", { class: "lu-nota", text: tg }));
      }
    }
    // ---- i numeri che cambiano senza ricostruire ----
    var P2 = ui.panEl || {};
    if (tipo === "sq-indovina" && P2.ok) {
      var mio = (vm.conferme || []).indexOf(cb.myId) >= 0, n = (vm.conferme || []).length;
      tx(P2.ok, mio ? "↩️ Non ancora" : "✅ Ci siamo");
      P2.ok.className = "lu-btn " + (mio ? "grigio" : "");
      tx(P2.nota, n ? "Confermati " + n + " su " + vm.serve + " che servono" : "Quando siete d'accordo: «Ci siamo»");
    }
    if (tipo === "scommetto" && P2.nota) {
      var vo = vm.voti || {}, nsx = 0, ndx = 0;
      Object.keys(vo).forEach(function (x) { if (vo[x] === "sx") nsx++; else ndx++; });
      tx(P2.sx, "⬅️ Più a sinistra"); tx(P2.dx, "Più a destra ➡️");
      P2.sx.classList.toggle("scelto", vo[cb.myId] === "sx"); P2.dx.classList.toggle("scelto", vo[cb.myId] === "dx");
      tx(P2.nota, nsx === ndx && nsx ? "Pari: vale il primo voto" : "Decidete insieme: se avete ragione, +1");
    }
    if (tipo === "s-cosa-parola" && P2.altre) P2.altre.disabled = !seg || !!seg.altre;
    if (tipo === "rivela" && P2.av) aggAvanti(ui, vm, cb);
  }
  function aggAvanti(ui, vm, cb) {
    var P = ui.panEl || {}; if (!P.av) return;
    var kt = vm.partita + "|" + vm.turno, l = vm.pronti || [], mio = ui.mioAv === kt || l.indexOf(cb.myId) >= 0;
    var n = l.length + (mio && l.indexOf(cb.myId) < 0 ? 1 : 0), serve = vm.servonoAv || 1;
    tx(P.avTx, mio ? (P.avUltimo ? "✅ Classifica" : "✅ Avanti") : (P.avUltimo ? "🏆 Classifica" : "⏩ Avanti"));
    tx(P.avN, Math.min(n, serve) + " su " + serve);
    P.av.disabled = mio;
    P.av.classList.toggle("fatto", mio);
  }
  function bottoneCarta(t, sc, fn, nostra) {
    var b = bottone(t, "", "", fn);
    b.className = "lu-carta" + (nostra ? " nostra" : "");
    b.appendChild(t.el("span", { text: sc[0] })); b.appendChild(t.el("i", { text: nostra ? "📝" : "←→" })); b.appendChild(t.el("span", { text: sc[1] }));
    if (nostra) b.setAttribute("aria-label", sc[0] + " ←→ " + sc[1] + ", scala della compagnia");
    return b;
  }
  // le righe dell'esito (sotto il quadrante, dopo la rivelazione)
  function righeEsito(t, box, vm, R, myId) {
    var el = t.el, righe = [];
    if (R.saltato) righe.push(["b", R.saltato]);
    else if (vm.formula === "squadre") {
      righe.push(["b", R.tele ? "🧠 TELEPATIA! +4 alla Squadra " + SQ[R.sq] : R.pt === 4 ? "🎯 Centro! +4 alla Squadra " + SQ[R.sq] : R.pt ? "+" + R.pt + " alla Squadra " + SQ[R.sq] : "Fuori! Nessun punto alla Squadra " + SQ[R.sq]]);
      if (R.scom) righe.push(["s", (R.scom.lato === "sx" ? "⬅️" : "➡️") + " La Squadra " + SQ[R.scom.sq] + (R.scom.giusta ? " aveva ragione: +1" : " ha sbagliato la scommessa") + (R.scom.pari ? " (pari: valeva il primo voto)" : "")]);
      if (R.rimonta) righe.push(["b", "🔁 Centro e siete ancora dietro: RIGIOCATE!"]);
    } else {
      var pts = R.pts || {}, ids = Object.keys(R.lanP || {});
      var best = ids.slice().sort(function (a, b) { return Math.abs(R.lanP[a] - R.bers) - Math.abs(R.lanP[b] - R.bers); })[0];
      var pb = best ? gioc(vm, best) : null;
      righe.push(["b", !ids.length ? "Nessuno ha mosso la lancetta!" : (pts[best] ? (pts[best] === 4 ? "🎯 " : "") + "Il più vicino: " + (best === myId ? "tu" : pb ? pb.nome : "…") + " (+" + pts[best] + ")" : "Tutti fuori bersaglio!")]);
      var io = gioc(vm, myId), mio = io && pts[myId] != null ? (R.sens === myId ? "Tu (sensitivo) prendi la media: +" + pts[myId] : "Tu: +" + pts[myId] + (!(myId in (R.lanP || {})) ? " (non hai mosso la lancetta)" : "")) : null;
      righe.push(["s", (mio ? mio + " · " : "") + (R.sens !== myId ? R.nome + " prende la media: +" + (R.media || 0) : "")]);
    }
    if (!R.saltato && R.modo === "cosa" && R.parola) righe.push(["s", "Per " + R.nome + ": " + R.parola + " → " + doveSta(R.bers, R.scala)]);
    else if (!R.saltato && R.parola) righe.push(["s", "Il bersaglio di " + R.nome + " era " + doveSta(R.bers, R.scala)]);
    righe.forEach(function (x) { box.appendChild(el(x[0] === "b" ? "b" : "span", { text: x[1].replace(/\s·\s$/, "") })); });
  }
  // ----- la rivelazione: nello stesso momento su tutti i telefoni (tamburo, tendina che gira, punti) -----
  function rivelaOnline(ui, vm, r) {
    var R = vm.rivela, k = "riv|" + vm.partita + "|" + vm.turno, Q = ui.Q, t = ui.t;
    if (ui.kRiv === k) return;
    ui.kRiv = k;
    var subito = (vm.resta || 0) < (R.saltato ? T_SALTA : T_RIVELA) - 2;   // arrivato tardi (pagina ricaricata): niente animazione
    ui.drag = false; Q.trascina(null); Q.tag(null); Q.togli(); chiudiFrasi(ui);
    function dopo(ms, fn) { setTimeout(function () { if (ui.kRiv === k && document.body.contains(ui.s)) fn(); }, ms); }
    function mostraEsito() { var e = ui.panEl && ui.panEl.esito; if (e) e.classList.add("vis"); }
    if (R.saltato) { Q.vediLan(false); Q.tendina("chiusa", true); Q.pop("⏭️ Turno saltato", "piccolo"); dopo(subito ? 0 : 300, mostraEsito); return; }
    Q.bers(R.bers);
    if (vm.formula === "squadre") { Q.vediLan(true); Q.lan(R.lan, true); } else Q.vediLan(false);
    function esito() {
      if (vm.formula === "squadre") {
        if (R.tele) { Q.pop("🧠 TELEPATIA!", "tele"); Q.coriandoli(); suono("tele"); }
        else if (R.pt === 4) { Q.pop("🎯 CENTRO! +4", "centro"); Q.coriandoli(); suono("centro"); }
        else if (R.pt) { Q.pop("+" + R.pt, "buono"); suono("buono"); }
        else { Q.pop("Fuori! 0", "fuori"); Q.vergogna(); suono("fuori"); }
        if (R.scom) {
          var lato = R.scom.lato === "sx" ? ui.sx : ui.dx;
          lato.classList.add(R.scom.giusta ? "ok" : "no");
          if (R.scom.giusta && !subito) setTimeout(function () { suono("ding"); }, 450);
        }
      } else {
        var ids = Object.keys(R.lanP || {}).sort(function (a, b) { return Math.abs(R.lanP[b] - R.bers) - Math.abs(R.lanP[a] - R.bers); });
        var messi = [];
        ids.forEach(function (id, i) {
          var p = gioc(vm, id), pt = (R.pts || {})[id] || 0, ultimo = i === ids.length - 1, v = R.lanP[id];
          // vicini tra loro: uno sopra l'altro, così si vedono tutti
          var sopra = messi.filter(function (x) { return Math.abs(x - v) < 6; }).length; messi.push(v);
          Q.vola(id, v, srcAvatar(ui.omini[id], p ? p.nome : "?"), { r: 101 + sopra * 17, cls: (ultimo && pt ? "re " : "") + (pt === 4 ? "ok" : ""), testo: (id === ui.cb.myId ? "Tu " : "") + (pt ? "+" + pt : "0") }, subito ? 10 : 30 + i * 300);
        });
        var c = ids.some(function (id) { return (R.pts || {})[id] === 4; });
        if (!subito) setTimeout(function () { if (ui.kRiv !== k) return; if (c) { Q.coriandoli(); suono("centro"); } else if (ids.length && !ids.some(function (id) { return (R.pts || {})[id]; })) suono("fuori"); else if (ids.length) suono("buono"); }, 30 + ids.length * 300);
      }
      mostraEsito();
    }
    if (subito) { Q.tendina("aperta", false); esito(); ui.anim = false; mettiPunti(ui, vm, r); return; }
    ui.anim = true;
    Q.tendina("chiusa", false);
    suono("tamburo"); Q.trema();
    dopo(600, function () { Q.tendina("aperta", true); });
    dopo(1850, esito);
    dopo(2700, function () { ui.anim = false; contaPunti(ui, ui.vm, ruolo(ui, ui.vm)); });
  }
  // i punti in alto che contano fino al nuovo valore
  function contaPunti(ui, vm, r) {
    var da = [Number(String(ui.aN.textContent).replace(/\D/g, "")) || 0, Number(String(ui.bN.textContent).replace(/\D/g, "")) || 0];
    mettiPunti(ui, vm, r);
    if (vm.formula !== "squadre") return;
    var a = [vm.sqPunti[0], vm.sqPunti[1]], n = [ui.aN, ui.bN];
    [0, 1].forEach(function (i) {
      if (a[i] <= da[i]) return;
      var v = da[i]; n[i].textContent = fmtN(v); n[i].parentNode.classList.add("sale");
      var iv = setInterval(function () { v++; n[i].textContent = fmtN(Math.min(v, a[i])); if (v >= a[i]) { clearInterval(iv); setTimeout(function () { n[i].parentNode.classList.remove("sale"); }, 500); } }, 160);
    });
  }

  // ----- fine partita: premi della serata, classifica con medaglie a pari merito, faccine, tasti del core -----
  function medaglie(posti) {
    var gruppi = 0, prec = null;
    return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return ["🥇", "🥈", "🥉"][gruppi - 1] || p + "°"; });
  }
  function finale(t, vm, cb) {
    stile();
    var f = vm.fine || {}, cl = f.classifica || [], fac = t.faccine(), sq = f.formula === "squadre";
    var titolo = sq ? (f.vinc < 0 ? "Pareggio!" : "Vince la Squadra " + SQ[f.vinc] + "!") : "Classifica finale";
    var s = t.schermata({ icona: sq ? (f.vinc < 0 ? "🤝" : "🏆") : "🏆", titolo: titolo });
    if (sq) s._contenuto.appendChild(t.el("div", { class: "lu-fin-sq" }, [0, 1].map(function (q) {
      return t.el("div", { class: (q ? "b" : "a") + (f.vinc === q ? " vince" : "") }, [t.el("span", { text: "Squadra " + SQ[q] }), t.el("b", { text: fmtN((f.sqPunti || [0, 0])[q]) })]);
    })));
    if (f.premi && f.premi.length) s._contenuto.appendChild(t.el("div", { class: "lu-premi" }, f.premi.map(function (p) { return t.el("div", { text: p }); })));
    var extra = (f.premi || []).length * 34 + (sq ? 70 : 0);
    var fitta = cl.length > 6 || cl.length * 66 + 300 + extra + (fac ? 56 : 0) > (window.innerHeight || 640);
    var ol = t.el("ol", { class: "classifica" + (fitta ? " fitta" : "") }), med = medaglie(cl.map(function (r) { return r.pos; }));
    cl.forEach(function (r, i) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: med[i] }),
        t.el("span", { class: "nome", text: (r.id === cb.myId ? r.nome + " (tu)" : r.nome) + (sq ? " · " + SQ[r.sq] : "") }),
        t.el("span", { class: "punti", text: fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    if (!cl.some(function (r) { return r.id === cb.myId; })) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Questa partita l'hai guardata." }));
    // I TASTI DI FINE LI METTE IL CORE (Rivincita col 3-2-1, Cambia gioco, Ci sto); se torna false, quelli di sempre
    if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
    return s;
  }
  // i contatori dei trofei (ognuno salva i suoi, una volta per partita)
  var statSalvate = {};
  function salvaStat(t, id, vm) {
    if (!id || !vm || !vm.pid || !vm.fine || statSalvate[vm.pid]) return;
    statSalvate[vm.pid] = true;
    if ((t.linkParams && (t.linkParams.prova || t.linkParams.guarda)) || (t.impostazioni && t.impostazioni.prova)) return;
    if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
    var x = vm.fine.stat && vm.fine.stat[id];
    if (!x) return;   // questa partita l'ho guardata
    var s0 = SGNube.statGioco ? (SGNube.statGioco(ID) || {}) : {};
    if (s0.ultimaPartitaTrofei === vm.pid) return;
    var incr = [["partite", 1]];
    ["centri", "turniSensitivo", "scommesseGiuste", "centriDati", "vittorie"].forEach(function (k) { if (x[k] > 0) incr.push([k, x[k]]); });
    try { SGNube.salvaProgressi(null, ID, incr, [], [["ultimaPartitaTrofei", vm.pid]]); } catch (e) {}
  }
  function salvaStatLocale(t, stat) {
    if (t.impostazioni && t.impostazioni.prova) return;
    if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
    var incr = [["partite", 1]];
    Object.keys(stat).forEach(function (k) { if (stat[k] > 0) incr.push([k, stat[k]]); });
    try { SGNube.salvaProgressi(null, ID, incr, [], []); } catch (e) {}
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online si gioca quando l'app è aperta dal sito pubblicato. Sullo stesso telefono funziona sempre." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  SULLO STESSO TELEFONO: il telefono in mezzo al tavolo
  // =========================================================
  function locale(t) {
    stile();
    var imp = impNorm(conNostre(t.impostazioni)), nomi = (t.giocatori || []).slice();
    if (nomi.length < 2) nomi = nomi.concat(["Giocatore 2"]).slice(0, 2);
    var L = { formula: imp.formula === "squadre" && nomi.length >= 4 ? "squadre" : "insieme", sq: [[], []], sqPunti: [0, 0], tot: 0, turno: 0, punt: [0, 0],
      sqTurno: Math.random() < 0.5 ? 0 : 1, idx: 0, mazzo: creaMazzo(imp), spareggio: 0, stessa: false, inRimonta: false,
      stat: { centri: 0, turniSensitivo: 0, scommesseGiuste: 0, centriDati: 0, vittorie: 0 } };
    var mio = t.nomeProfilo ? t.nomeProfilo() : "";
    function esci() { t.conferma("Uscire dalla partita?", null, "Esci", t.esci); }
    function dividi() { var m = mescola(nomi); L.sq = [[], []]; m.forEach(function (n, i) { L.sq[i % 2].push(n); }); }
    function squadraDi(n) { return L.sq[0].indexOf(n) >= 0 ? 0 : L.sq[1].indexOf(n) >= 0 ? 1 : -1; }
    if (L.formula === "squadre") { dividi(); return mostraSquadre(); }
    if (imp.formula === "squadre") L.avviso = "In " + nomi.length + " si gioca tutti insieme (a squadre servono almeno 4 persone)";
    turno();

    function mostraSquadre() {
      var s = t.schermata({ icona: "👥", titolo: "Le squadre", sotto: "Si vince a " + imp.traguardo + " punti", indietro: t.esci });
      var box = t.el("div", { class: "lu-fin-sq lu-sq-loc" });
      function disegnaSq() {
        svuota(box);
        [0, 1].forEach(function (q) { box.appendChild(t.el("div", { class: q ? "b" : "a" }, [t.el("span", { text: "Squadra " + SQ[q] }), t.el("small", { text: L.sq[q].join(", ") })])); });
      }
      disegnaSq();
      s._contenuto.appendChild(box);
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", text: "A turno uno fa il sensitivo: la sua squadra muove la lancetta, l'altra scommette se il bersaglio è più a sinistra o più a destra." }));
      s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🔀 Rimescola", onclick: function () { dividi(); disegnaSq(); } }));
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Via ▶", onclick: turno }));
      t.mostra(s);
    }
    function turno() {
      L.turno++;
      L.inRimonta = L.stessa; L.stessa = false;
      var sens, sq = -1;
      if (L.formula === "squadre") { sq = L.sqTurno; var m = L.sq[sq]; sens = m[L.punt[sq] % m.length]; L.punt[sq]++; }
      else { sens = nomi[L.idx % nomi.length]; L.idx++; }
      var T = { n: L.turno, sens: sens, sq: sq, modo: modoDelTurno(imp.domande, L.turno), scala: null, parola: null, bers: null, lan: 50, toccato: false };
      var nostra = L.mazzo.nostraOra();   // 📝 una scala scritta dal gruppo in questo turno?
      if (T.modo === "cosa") { var sc = L.mazzo.scala("cosa", nostra); if (!sc) T.modo = "classico"; else { T.sc = sc; T.scala = [sc.sx, sc.dx]; T.scalaN = !!sc.nostra; T.parole = L.mazzo.parole(sc, 3); T.altre = false; } }
      if (T.modo === "classico") { T.opz = mescola([L.mazzo.scala("classico", nostra), L.mazzo.scala("classico", nostra && imp.nostreModo === "solo")].filter(Boolean)); T.bers = 3 + Math.round(Math.random() * 94); }
      if (sens === mio) L.stat.turniSensitivo++;
      L.T = T;
      t.passaA(sens, function () { schermoTurno(); });
    }
    function schermoTurno() {
      var T = L.T, ui = L.ui = scheletro(t, esci), Q = ui.Q;
      ui.fondo.style.display = "none";
      tx(ui.turnoTx, L.formula === "squadre" ? (L.spareggio ? "Spareggio" : "Turno " + T.n) : "Turno " + T.n + "/" + TURNI_INSIEME);
      mettiPunteggio();
      mettiAvatar(ui, null, T.sens);
      tx(ui.chi, "🔮 " + T.sens + (T.sq >= 0 ? " · Squadra " + SQ[T.sq] : ""));
      mettiScala(ui, T.scala, T.scalaN);
      ui.timer.style.visibility = "hidden";
      t.mostra(ui.s); Q.misura();
      Q.bers(T.bers); Q.tendina("chiusa", false); Q.vediLan(false);
      if (T.modo === "classico") faseScala(); else faseParola();
      if (L.avviso) { banner(ui, L.avviso); L.avviso = null; }
    }
    function mettiPunteggio() {
      var ui = L.ui;
      if (L.formula === "squadre") {
        ui.a.className = "lu-box a sq" + (L.T && L.T.sq === 0 ? " tocca" : ""); ui.b.className = "lu-box b sq" + (L.T && L.T.sq === 1 ? " tocca" : "");
        tx(ui.aT, "Squadra A"); tx(ui.aN, fmtN(L.sqPunti[0])); tx(ui.bT, "Squadra B"); tx(ui.bN, fmtN(L.sqPunti[1]));
      } else { tx(ui.aT, "Tutti insieme"); tx(ui.aN, fmtN(L.tot)); tx(ui.bT, "Su"); tx(ui.bN, fmtN(TURNI_INSIEME * 4)); }
      var g = ui.gente; svuota(g);
      if (L.formula === "squadre") [0, 1].forEach(function (q) { L.sq[q].forEach(function (n) { g.appendChild(t.el("div", { class: "lu-p " + (q ? "b" : "a") + (L.T && n === L.T.sens ? " si" : "") }, [t.el("img", { alt: "", src: srcAvatar(null, n) }), t.el("span", { text: n })])); }); });
    }
    function pan() { var ui = L.ui; svuota(ui.pan); ui.root.classList.remove("scrive"); ui.Q.trascina(null); return ui.pan; }
    function tienePremuto(testo) {   // "👁️ Tieni premuto per vedere il bersaglio": la tendina si apre solo finché si tiene il dito
      var Q = L.ui.Q, b = t.el("button", { class: "lu-btn grigio piccolo", type: "button", text: testo });
      function giu(e) { e.preventDefault(); Q.tendina("sbircia", false); }
      function su() { Q.tendina("chiusa", false); }
      b.addEventListener("pointerdown", giu); b.addEventListener("pointerup", su); b.addEventListener("pointerleave", su); b.addEventListener("pointercancel", su);
      b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
      return b;
    }
    function faseScala() {
      var T = L.T, p = pan();
      mettiParola(L.ui, "🤫 Gli altri non guardano!", true);
      tx(L.ui.sotto, "🎯 Classico: scegli la scala");
      T.opz.forEach(function (sc) { p.appendChild(bottoneCarta(t, [sc.sx, sc.dx], function () {
        T.scala = [sc.sx, sc.dx]; T.scalaN = !!sc.nostra; T.opz.forEach(function (o) { if (o !== sc) L.mazzo.libera(o); });
        mettiScala(L.ui, T.scala, T.scalaN); faseIndizio();
      }, !!sc.nostra)); });
    }
    function faseIndizio() {
      var T = L.T, p = pan(), ui = L.ui;
      mettiParola(ui, "👁️ Guarda il bersaglio, poi l'indizio", true);
      tx(ui.sotto, "Trova una parola che stia proprio lì");
      var campo = t.el("input", { class: "lu-campo", type: "text", maxlength: "30", placeholder: "Il tuo indizio (o dillo a voce)", enterkeyhint: "done" });
      var err = t.el("div", { class: "lu-nota lu-err" });
      p.appendChild(tienePremuto("👁️ Tieni premuto per vedere il bersaglio"));
      p.appendChild(campo); p.appendChild(err); tastiera(ui, campo);
      p.appendChild(bottone(t, "", "📣 Fatto: telefono in mezzo", function () {
        var v = pulisci(campo.value);
        if (v && indizioVietato(v, T.scala)) { tx(err, "Non puoi usare le parole della scala!"); return; }
        T.parola = v || null; faseIndovina();
      }));
    }
    function faseParola(scrivo) {
      var T = L.T, p = pan(), ui = L.ui;
      mettiParola(ui, "🤫 Gli altri non guardano!", true);
      tx(ui.sotto, "🤔 Cosa ne pensi? Scegli la parola");
      if (scrivo) {
        var campo = t.el("input", { class: "lu-campo", type: "text", maxlength: "30", placeholder: "La tua parola" }), err = t.el("div", { class: "lu-nota lu-err" });
        p.appendChild(campo); p.appendChild(err); tastiera(L.ui, campo);
        p.appendChild(t.el("div", { class: "lu-riga" }, [bottone(t, "grigio", "‹ Le parole pronte", function () { faseParola(false); }), bottone(t, "", "OK ▶", function () {
          var v = pulisci(campo.value);
          if (!v) { tx(err, "Scrivi qualcosa!"); return; }
          if (indizioVietato(v, T.scala)) { tx(err, "Non puoi usare le parole della scala!"); return; }
          T.parola = v; fasePiazza();
        })]));
        return;
      }
      var g = t.el("div", { class: "lu-riga" });
      T.parole.forEach(function (w) { g.appendChild(bottone(t, "viola parola", w, function () { T.parola = w; fasePiazza(); })); });
      var altre = bottone(t, "grigio piccolo", "🔄 Altre 3", function () { var n = L.mazzo.parole(T.sc, 3); if (n.length) T.parole = n; T.altre = true; faseParola(false); });
      altre.disabled = T.altre; g.appendChild(altre);
      p.appendChild(g);
      p.appendChild(bottone(t, "grigio piccolo", "✏️ La scelgo io", function () { faseParola(true); }));
    }
    function fasePiazza() {
      var T = L.T, p = pan(), ui = L.ui, Q = ui.Q;
      mettiParola(ui, T.parola, false);
      tx(ui.sotto, "Tieni il dito sul quadrante e metti il bersaglio");
      T.bers = 50; Q.bers(50);
      var nota = t.el("div", { class: "lu-nota", text: "🤫 Il bersaglio si vede solo mentre tieni il dito sul quadrante." });
      var ok = bottone(t, "", "📍 Lo metto qui", function () { faseIndovina(); }); ok.disabled = true;
      p.appendChild(nota); p.appendChild(ok);
      Q.trascina("bers", function (v, fase) {
        T.bers = v; Q.bers(v);
        if (fase === "giu") Q.tendina("sbircia", false);
        if (fase === "su") { Q.tendina("chiusa", false); ok.disabled = false; }
      });
    }
    function faseIndovina() {
      var T = L.T, p = pan(), ui = L.ui, Q = ui.Q;
      Q.tendina("chiusa", false);
      if (T.parola) mettiParola(ui, T.parola, false); else mettiParola(ui, "🗣️ " + T.sens + " dice l'indizio a voce", true);
      var chi = L.formula === "squadre" ? "Squadra " + SQ[T.sq] + " (" + L.sq[T.sq].filter(function (n) { return n !== T.sens; }).join(", ") + ")" : "Tutti";
      tx(ui.sotto, "📱 Telefono in mezzo al tavolo! " + chi + ": muovete la lancetta");
      T.lan = 50; Q.vediLan(true); Q.lan(50, false);
      p.appendChild(t.el("div", { class: "lu-nota", text: T.sens + " non può aiutare: muto come un pesce! 🤐" }));
      p.appendChild(bottone(t, "", "✅ Ci siamo", function () { Q.trascina(null); if (L.formula === "squadre") faseScommessa(); else faseSvela(); }));
      Q.trascina("lan", function (v) { T.lan = v; Q.lan(v, false); });
    }
    function faseScommessa() {
      var T = L.T, p = pan(), altra = 1 - T.sq;
      tx(L.ui.sotto, "Squadra " + SQ[altra] + ": dov'è il bersaglio rispetto alla lancetta?");
      p.appendChild(t.el("div", { class: "lu-nota", text: "Tocca alla Squadra " + SQ[altra] + " (" + L.sq[altra].join(", ") + ")" }));
      p.appendChild(t.el("div", { class: "lu-riga" }, [
        bottone(t, "blu", "⬅️ Più a sinistra", function () { T.lato = "sx"; faseSvela(); }),
        bottone(t, "aran", "Più a destra ➡️", function () { T.lato = "dx"; faseSvela(); }) ]));
      p.appendChild(bottone(t, "grigio piccolo", "Niente scommessa", function () { T.lato = null; faseSvela(); }));
    }
    function faseSvela() {
      var p = pan();
      tx(L.ui.sotto, "Pronti? Si scopre il bersaglio!");
      p.appendChild(bottone(t, "giallo", "🥁 Svela!", rivelaLoc));
    }
    function rivelaLoc() {
      tx(L.ui.sotto, "🥁 Ecco dov'era!");
      var T = L.T, ui = L.ui, Q = ui.Q, p = pan(), pt = puntiDi(T.lan, T.bers), tele = Math.abs(T.lan - T.bers) < 0.5;
      var esito = t.el("div", { class: "lu-esito" }), righe = [], fine = false;
      if (L.formula === "squadre") {
        var altra = 1 - T.sq; L.sqPunti[T.sq] += pt;
        righe.push(["b", tele ? "🧠 TELEPATIA! +4 alla Squadra " + SQ[T.sq] : pt === 4 ? "🎯 Centro! +4 alla Squadra " + SQ[T.sq] : pt ? "+" + pt + " alla Squadra " + SQ[T.sq] : "Fuori! Nessun punto"]);
        var giusta = false;
        if (T.lato) { giusta = pt < 4 && (T.lato === "sx" ? T.bers < T.lan : T.bers > T.lan); if (giusta) L.sqPunti[altra]++; righe.push(["s", (T.lato === "sx" ? "⬅️" : "➡️") + " La Squadra " + SQ[altra] + (giusta ? " aveva ragione: +1" : " ha sbagliato la scommessa")]); }
        if (mio && squadraDi(mio) === T.sq && mio !== T.sens && pt === 4) L.stat.centri++;
        if (mio === T.sens && pt === 4) L.stat.centriDati++;
        if (mio && squadraDi(mio) === altra && giusta) L.stat.scommesseGiuste++;
        var rim = pt === 4 && !L.spareggio && !L.inRimonta && L.sqPunti[T.sq] < L.sqPunti[altra];
        if (rim) { L.stessa = true; righe.push(["b", "🔁 Centro e siete ancora dietro: RIGIOCATE!"]); }
        var a = L.sqPunti[0], b = L.sqPunti[1], tr = imp.traguardo;
        if (L.spareggio) { L.spareggio--; if (!L.spareggio) fine = true; }
        else if (a >= tr || b >= tr) { if (a !== b) fine = true; else { L.spareggio = 2; righe.push(["b", "⚖️ Pari al traguardo! Spareggio: un turno a squadra"]); } }
        if (L.turno >= 80) fine = true;
        T.giusta = giusta;
      } else {
        L.tot += pt;
        if (mio && mio !== T.sens && pt === 4) L.stat.centri++;
        if (mio === T.sens && pt === 4) L.stat.centriDati++;
        righe.push(["b", tele ? "🧠 TELEPATIA! +4" : pt === 4 ? "🎯 Centro! +4" : pt ? "+" + pt + " punti" : "Fuori! 0 punti"]);
        righe.push(["s", "In tutto: " + testoPunti(L.tot) + " su " + (L.turno * 4)]);
        fine = L.turno >= TURNI_INSIEME;
      }
      if (T.modo === "cosa" && T.parola) righe.push(["s", "Per " + T.sens + ": " + T.parola + " → " + doveSta(T.bers, T.scala)]);
      else righe.push(["s", "Il bersaglio era " + doveSta(T.bers, T.scala)]);
      righe.forEach(function (x) { esito.appendChild(t.el(x[0] === "b" ? "b" : "span", { text: x[1] })); });
      p.appendChild(esito);
      // l'animazione: tamburo, la tendina che gira, il cartello dei punti
      Q.bers(T.bers); suono("tamburo"); Q.trema();
      setTimeout(function () { Q.tendina("aperta", true); }, 600);
      setTimeout(function () {
        if (tele) { Q.pop("🧠 TELEPATIA!", "tele"); Q.coriandoli(); suono("tele"); }
        else if (pt === 4) { Q.pop("🎯 CENTRO! +4", "centro"); Q.coriandoli(); suono("centro"); }
        else if (pt) { Q.pop("+" + pt, "buono"); suono("buono"); }
        else { Q.pop("Fuori! 0", "fuori"); Q.vergogna(); suono("fuori"); }
        if (T.lato) (T.lato === "sx" ? ui.sx : ui.dx).classList.add(T.giusta ? "ok" : "no");
        esito.classList.add("vis"); mettiPunteggio();
        p.appendChild(bottone(t, "giallo", fine ? "Classifica 🏆" : "Avanti ▶", function () {
          if (fine) return finePartita();
          if (L.formula === "squadre" && !L.stessa) L.sqTurno = 1 - L.sqTurno;
          turno();
        }));
      }, 1850);
    }
    function finePartita() {
      L.mazzo.salva();   // le scale e le parole uscite non tornano subito nella prossima partita
      if (L.formula === "squadre") {
        var v = L.sqPunti[0] === L.sqPunti[1] ? -1 : (L.sqPunti[0] > L.sqPunti[1] ? 0 : 1);
        var primi = v < 0 ? nomi.length : L.sq[v].length, cl = [];
        [0, 1].forEach(function (q) { L.sq[q].forEach(function (n) { cl.push({ nome: n, punti: L.sqPunti[q], pos: v < 0 || q === v ? 1 : primi + 1 }); }); });
        cl.sort(function (a, b) { return a.pos - b.pos; });
        if (mio && v >= 0 && squadraDi(mio) === v) L.stat.vittorie = 1;
        salvaStatLocale(t, L.stat);
        return t.fine(cl);
      }
      // tutti insieme: il voto alla compagnia, poi la classifica (tutti primi: si gioca insieme)
      var ui = L.ui, p = pan(), voto = L.tot >= 22 ? "🔮 Telepatia!" : L.tot >= 16 ? "🧠 Ci capiamo al volo" : L.tot >= 10 ? "📶 C'è campo" : "📻 Fuori frequenza";
      ui.Q.pop(voto, "tele");
      tx(ui.parola, testoPunti(L.tot) + " su " + (TURNI_INSIEME * 4)); ui.parola.className = "lu-parola";
      tx(ui.sotto, "Il voto alla compagnia");
      if (L.tot >= 16) ui.Q.coriandoli();
      if (mio) L.stat.vittorie = L.tot >= 16 ? 1 : 0;
      salvaStatLocale(t, L.stat);
      p.appendChild(t.el("div", { class: "lu-esito vis" }, [t.el("b", { text: "Avete fatto " + testoPunti(L.tot) + " in " + TURNI_INSIEME + " turni." })]));
      p.appendChild(bottone(t, "giallo", "Classifica 🏆", function () { t.fine(nomi.map(function (n) { return { nome: n, punti: L.tot, pos: 1 }; })); }));
    }
  }

  // =========================================================
  //  STILE (un <style> solo, prefisso lu-)
  // =========================================================
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.lu-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#0f0b2e}",
      ".schermata.lu-piena>.testa,.schermata.lu-piena>.piede{display:none}",
      ".schermata.lu-piena>.contenuto{height:100%;margin:0;padding:0;max-width:none}",
      ".lu{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:calc(6px + env(safe-area-inset-top)) 10px calc(8px + env(safe-area-inset-bottom));overflow:hidden;color:#fff;user-select:none;-webkit-user-select:none;background:radial-gradient(120% 65% at 50% 42%,#3b2a8f 0%,#1b1455 46%,#0c0924 100%)}",
      ".lu::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.7;background-image:radial-gradient(1.4px 1.4px at 9% 14%,#fff,transparent),radial-gradient(1px 1px at 22% 72%,#fffa,transparent),radial-gradient(1.2px 1.2px at 78% 9%,#fff,transparent),radial-gradient(1px 1px at 91% 58%,#fffa,transparent),radial-gradient(1.3px 1.3px at 56% 4%,#fff,transparent),radial-gradient(1px 1px at 4% 46%,#fff8,transparent),radial-gradient(1px 1px at 67% 88%,#fff8,transparent)}",
      ".lu>*{position:relative}",
      ".lu-barra{flex:none;display:grid;grid-template-columns:36px minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:6px}",
      ".lu-esci{width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".lu-box{min-width:0;border-radius:12px;padding:3px 8px;background:rgba(255,255,255,.1);text-align:center;line-height:1.1;transition:background .3s}",
      ".lu-box span{display:block;font-size:11px;font-weight:800;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".lu-box b{display:block;font-size:clamp(16px,5.4vw,22px);font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".lu-box.a.sq{box-shadow:inset 0 -3px #f06595}.lu-box.b.sq{box-shadow:inset 0 -3px #5c7cfa}.lu-box.mia{outline:2px solid #ffd43b;outline-offset:-2px}.lu-box.tocca{background:rgba(255,212,59,.2)}",
      ".lu-box.sale b{animation:luSale .35s ease infinite alternate}@keyframes luSale{from{transform:scale(1)}to{transform:scale(1.18)}}",
      ".lu-centro{display:flex;flex-direction:column;align-items:center;gap:1px}.lu-turno{font-size:10px;font-weight:800;opacity:.75;white-space:nowrap}",
      ".lu-timer{position:relative;width:36px;height:36px}.lu-timer svg{width:100%;height:100%;transform:rotate(-90deg)}.lu-timer circle{fill:none;stroke-width:3.5}.lu-timer .f{stroke:rgba(255,255,255,.15)}.lu-timer .p{stroke:#69db7c;stroke-linecap:round;stroke-dasharray:97.4}.lu-timer.rosso .p{stroke:#ff6b6b}.lu-timer.rosso span{color:#ff8787}.lu-timer span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:1000;font-size:13px}.lu-timer.spento{opacity:.25}",
      ".lu-testa{flex:none;display:flex;align-items:center;gap:8px;min-height:40px}",
      ".lu-av{flex:none;width:40px;height:40px;border-radius:50%;overflow:hidden;background:linear-gradient(#7048e8,#4c2fb0);box-shadow:0 0 0 2px #b197fc,0 0 14px #845ef788}.lu-av img{width:100%;height:100%;object-fit:cover;object-position:50% 6%}",
      ".lu-chi{min-width:0;display:flex;flex-direction:column;line-height:1.18}.lu-chi b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lu-chi span{font-size:13px;font-weight:700;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".lu-parola{flex:none;margin:auto 0;text-align:center;font-weight:1000;font-size:clamp(22px,8vw,34px);line-height:1.12;min-height:1.12em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 2px 14px #b197fcaa}.lu-parola.media{font-size:clamp(18px,6vw,27px)}.lu-parola.lunga{font-size:clamp(15px,4.7vw,21px)}.lu-parola.pensa{font-size:clamp(14px,4.3vw,18px);font-weight:800;opacity:.85;text-shadow:none;line-height:1.5}",
      ".lu-dial{flex:1 1 auto;min-height:96px;position:relative;touch-action:none}.lu-dial>svg{position:absolute;inset:0;width:100%;height:100%;overflow:hidden}.lu-dial.tocca{cursor:pointer}",
      ".lu-g-lan,.lu-g-bers,.lu-g-tenda,.lu-lan-in,.lu-tenda-in{transform-box:view-box;transform-origin:100px 104px}",
      ".lu-g-lan{transition:opacity .25s}.lu-g-lan.liscia{transition:transform .14s linear,opacity .25s}",
      ".lu-g-tenda{transition:transform 1.25s cubic-bezier(.55,-.25,.3,1.2),opacity .3s}.lu-g-tenda.sbircia{opacity:.3}.lu-g-tenda.aperta{transform:rotate(180deg)}.lu-g-tenda.subito{transition:none}",
      ".lu-tenda-in.trema{animation:luTrema .55s ease-in-out}@keyframes luTrema{0%,100%{transform:rotate(0)}20%{transform:rotate(-2.2deg)}40%{transform:rotate(2.2deg)}60%{transform:rotate(-1.5deg)}80%{transform:rotate(1deg)}}",
      ".lu-lan-in.vergogna{animation:luVerg .6s ease-in-out}@keyframes luVerg{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}75%{transform:rotate(-2deg)}}",
      ".lu-sopra{position:absolute;inset:0;pointer-events:none}",
      ".lu-tag{position:absolute;left:0;top:0;padding:3px 9px;border-radius:999px;background:#fff;color:#2b1d6b;font-weight:900;font-size:12px;white-space:nowrap;box-shadow:0 3px 10px #0006;opacity:0;transition:transform .14s linear,opacity .2s}.lu-tag.vis{opacity:1}",
      ".lu-mk{position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;transition:transform .5s cubic-bezier(.3,1.4,.5,1),opacity .35s;will-change:transform}.lu-mk.subito{transition:none}",
      ".lu-mk img{width:30px;height:30px;border-radius:50%;object-fit:cover;object-position:50% 6%;background:#e9e4ff;box-shadow:0 0 0 2px #fff,0 3px 8px #0007}.lu-mk.ok img{box-shadow:0 0 0 2.5px #69db7c,0 3px 8px #0007}",
      ".lu-mk b{margin-top:-4px;padding:0 5px;border-radius:999px;background:#ffd43b;color:#3b2a00;font-size:11px;font-weight:1000;white-space:nowrap}.lu-mk b:empty{display:none}.lu-mk.re::before{content:'👑';position:absolute;top:-16px;font-size:16px}",
      ".lu-pop{position:absolute;left:50%;top:0;z-index:2;transform:translate(-50%,-80%) scale(.6);opacity:0;padding:7px 16px;border-radius:18px;background:#fff;color:#2b1d6b;font-weight:1000;font-size:clamp(20px,6.5vw,30px);white-space:nowrap;box-shadow:0 10px 30px #0008}",
      ".lu-pop.vis{animation:luPop .5s cubic-bezier(.3,1.6,.5,1) forwards}.lu-pop.centro{background:#ff2d55;color:#fff}.lu-pop.buono{background:#ffd43b;color:#3b2a00}.lu-pop.fuori{background:#495057;color:#fff}.lu-pop.tele{background:linear-gradient(90deg,#845ef7,#ff2d55);color:#fff}.lu-pop.piccolo{font-size:clamp(15px,4.6vw,19px)}",
      "@keyframes luPop{to{transform:translate(-50%,-80%) scale(1);opacity:1}}",
      ".lu-cor{position:absolute;left:50%;top:62%;width:8px;height:12px;border-radius:2px;opacity:0;animation:luCor 1.4s cubic-bezier(.2,.7,.4,1) forwards}@keyframes luCor{0%{transform:translate(-50%,-50%) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}",
      ".lu-estremi{flex:none;display:grid;grid-template-columns:1fr 1fr;gap:8px}",
      ".lu-est{min-height:34px;display:flex;align-items:center;border-radius:12px;padding:4px 10px;font-weight:900;font-size:clamp(13px,4vw,17px);line-height:1.12;transition:box-shadow .3s,opacity .3s}",
      ".lu-est.sx{background:linear-gradient(90deg,#1971c2,#3b5bdb);justify-content:flex-start;text-align:left}.lu-est.dx{background:linear-gradient(90deg,#e8590c,#f76707);justify-content:flex-end;text-align:right}",
      ".lu-est.vuoto{opacity:.35}.lu-est.ok{box-shadow:0 0 0 3px #69db7c,0 0 20px #69db7c}.lu-est.no{box-shadow:0 0 0 3px #ff6b6b;opacity:.75}",
      ".lu-gente{flex:none;display:flex;flex-wrap:wrap;justify-content:center;gap:4px;max-height:50px;overflow:hidden}.lu-gente:empty{display:none}",
      ".lu-p{display:inline-flex;align-items:center;gap:4px;padding:2px 8px 2px 2px;border-radius:999px;background:rgba(255,255,255,.1);font-size:12px;font-weight:800;max-width:46%}",
      ".lu-p img{flex:none;width:20px;height:20px;border-radius:50%;object-fit:cover;object-position:50% 6%;background:#e9e4ff}.lu-p span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lu-p i{font-style:normal;white-space:nowrap}",
      ".lu-p.a{box-shadow:inset 0 -2px #f06595}.lu-p.b{box-shadow:inset 0 -2px #5c7cfa}.lu-p.si{background:rgba(105,219,124,.28)}.lu-p.via{opacity:.4}.lu-p.tu{outline:1.5px solid #ffd43b}",
      ".lu-pan{flex:none;display:flex;flex-direction:column;gap:6px}",
      ".lu-btn{min-height:50px;border:0;border-radius:16px;background:#69db7c;color:#0f2d14;font:inherit;font-size:clamp(16px,4.8vw,20px);font-weight:1000;box-shadow:0 5px 0 #0004;touch-action:manipulation;-webkit-tap-highlight-color:transparent;padding:6px 10px;cursor:pointer}",
      ".lu-btn:active{transform:translateY(2px);box-shadow:0 3px 0 #0004}.lu-btn:disabled{opacity:.4;box-shadow:none}",
      ".lu-btn.giallo{background:#ffd43b;color:#3b2a00}.lu-btn.viola{background:#9775fa;color:#fff}.lu-btn.grigio{background:rgba(255,255,255,.15);color:#fff;box-shadow:none}.lu-btn.blu{background:#4dabf7;color:#062a49}.lu-btn.aran{background:#ff922b;color:#3b1500}",
      ".lu-btn.scelto{outline:3px solid #fff;outline-offset:-3px}.lu-btn.piccolo{min-height:40px;font-size:clamp(13px,3.9vw,16px)}.lu-btn.parola{min-height:44px;font-size:clamp(14px,4.2vw,17px);line-height:1.1}",
      ".lu-riga{display:grid;grid-template-columns:1fr 1fr;gap:6px}",
      ".lu-nota{text-align:center;font-size:clamp(13px,3.8vw,15px);font-weight:750;opacity:.88;line-height:1.25}.lu-err{color:#ffa8a8;min-height:0}.lu-err:empty{display:none}",
      ".lu-carta{display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:48px;border:0;border-radius:14px;padding:6px 10px;background:linear-gradient(90deg,#1971c2 0%,#5f3dc4 50%,#e8590c 100%);color:#fff;font:inherit;font-weight:900;font-size:clamp(13px,4vw,16px);box-shadow:0 4px 0 #0005;cursor:pointer;text-align:left}.lu-carta span:last-child{text-align:right}.lu-carta i{font-style:normal;opacity:.75}",
      ".lu-campo{width:100%;box-sizing:border-box;min-height:46px;border-radius:14px;border:2px solid #9775fa;background:#fff;color:#1a1352;font:inherit;font-size:18px;font-weight:800;padding:8px 12px;user-select:text;-webkit-user-select:text}",
      ".lu-esito{display:flex;flex-direction:column;gap:2px;text-align:center;opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s}.lu-esito.vis{opacity:1;transform:none}.lu-esito b{font-size:clamp(15px,4.6vw,19px)}.lu-esito span{font-size:clamp(12px,3.6vw,14px);font-weight:750;opacity:.9}",
      ".lu-conto{margin:0;text-align:center;font-weight:800;opacity:.8;min-height:1.2em}",
      ".lu-fondo{flex:none;display:flex;align-items:center;justify-content:center;gap:6px;min-height:40px}.lu-fondo .sl-faccine{margin:0;flex:0 1 auto;min-width:0}",
      ".lu-frasi-b{flex:none;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.14);font-size:20px;cursor:pointer}.lu-muto{font-weight:800;font-size:13px;opacity:.85;text-align:center}",
      ".lu-frasi{position:absolute;left:10px;right:10px;bottom:calc(54px + env(safe-area-inset-bottom));z-index:5;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px;border-radius:16px;background:#2b2266;box-shadow:0 10px 30px #0009}",
      ".lu-fum{position:absolute;left:50%;z-index:4;max-width:80%;overflow:hidden;text-overflow:ellipsis;padding:6px 12px;border-radius:14px;background:#fff;color:#2b1d6b;font-weight:900;font-size:14px;white-space:nowrap;box-shadow:0 6px 18px #0007;pointer-events:none;animation:luFum 2.6s ease forwards}",
      "@keyframes luFum{0%{opacity:0;transform:translate(-50%,10px) scale(.8)}12%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1;transform:translate(-50%,-6px)}100%{opacity:0;transform:translate(-50%,-14px)}}",
      ".lu-banner{position:absolute;left:10px;right:10px;top:calc(46px + env(safe-area-inset-top));z-index:6;padding:8px 12px;border-radius:14px;background:#ffd43b;color:#3b2a00;font-weight:900;text-align:center;font-size:14px;box-shadow:0 8px 20px #0007;opacity:0;transform:translateY(-10px);transition:opacity .25s,transform .25s;pointer-events:none}.lu-banner.vis{opacity:1;transform:none}",
      ".lu-squad-box{display:flex;flex-direction:column;gap:4px;margin:2px 0}.lu-sq-testa{display:flex;align-items:center;gap:8px;min-height:28px}",
      ".lu-squad-lista{display:flex;gap:4px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;align-items:center;border-radius:12px;padding:4px 6px;background:rgba(0,0,0,.05)}.lu-squad-lista::-webkit-scrollbar{display:none}.lu-squad-lista>*{flex:none}",
      ".lu-squad-lista.a{border-left:4px solid #e64980}.lu-squad-lista.b{border-left:4px solid #4263eb}.lu-squad-lista b{font-size:13px;min-width:2.4em;white-space:nowrap}",
      ".lu-scelta{border:0;border-radius:999px;padding:4px 10px;color:#fff;font:inherit;font-size:13px;font-weight:850;line-height:1.25;background:#383d59;max-width:9.5em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lu-scelta.a{background:#c2255c}.lu-scelta.b{background:#364fc7}.lu-scelta.tu{outline:2px solid #ffd43b}",
      ".lu-entra-sq{border:1.5px dashed currentColor;border-radius:999px;padding:3px 9px;background:transparent;font:inherit;font-size:12px;font-weight:850;line-height:1.25;color:inherit;opacity:.75}",
      ".lu-casuale{flex:none;border:0;border-radius:999px;padding:5px 11px;background:#ffd43b;color:#332500;font:inherit;font-size:13px;font-weight:950}.lu-sq-nota{min-width:0;font-size:12px;font-weight:700;line-height:1.25;opacity:.75}",
      ".lu-fin-sq{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 8px}.lu-fin-sq>div{border-radius:14px;padding:6px;text-align:center;background:var(--carta,rgba(255,255,255,.08))}.lu-fin-sq>div.a{box-shadow:inset 0 -4px #e64980}.lu-fin-sq>div.b{box-shadow:inset 0 -4px #4263eb}",
      ".lu-fin-sq span{display:block;font-weight:800;font-size:14px;opacity:.85}.lu-fin-sq b{display:block;font-size:30px;font-weight:1000;line-height:1.1}.lu-fin-sq small{display:block;font-weight:700;font-size:14px;margin-top:4px}.lu-fin-sq>div.vince{outline:3px solid #ffd43b;outline-offset:-3px}",
      ".lu-premi{display:flex;flex-direction:column;gap:4px;margin:0 0 8px}.lu-premi div{border-radius:12px;padding:5px 10px;background:rgba(255,212,59,.16);font-weight:800;font-size:13.5px;line-height:1.25}",
      // 📝 le nostre scale: la firma sopra la scala, la carta col 📝 (Classico), l'elenco nelle regole
      ".lu-firma{position:absolute;left:50%;top:-9px;transform:translateX(-50%);padding:1px 8px;border-radius:999px;background:#ffd43b;color:#3b2a00;font-size:10.5px;font-weight:900;line-height:1.5;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .3s;box-shadow:0 2px 6px #0006;z-index:1}.lu-firma.vis{opacity:1}",
      ".lu-carta.nostra{box-shadow:0 0 0 2.5px #ffd43b,0 4px 0 #0005}.lu-carta.nostra i{opacity:1}",
      ".lu-nostre-agg{display:flex;gap:6px;align-items:stretch}.lu-nostre-agg .link-campo{flex:1;min-width:0;margin:0;resize:none;min-height:46px;font:inherit;font-size:15px;line-height:1.3;padding:6px 10px;box-sizing:border-box}",
      ".lu-nostre-esito{min-height:1.2em;margin:4px 0 0}.lu-nostre-conta{font-size:.8rem;font-weight:800;opacity:.8;margin:6px 0 4px}",
      ".lu-nostre-lista{display:flex;flex-wrap:wrap;gap:6px}.lu-nostre-tasti{display:flex;gap:6px;margin-top:8px}",
      ".lu-nostra{display:inline-flex;align-items:center;gap:4px;max-width:100%;box-sizing:border-box;padding:4px 4px 4px 10px;border-radius:999px;background:rgba(127,127,127,.2);font-weight:800;font-size:.85rem}.lu-nostra>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".lu-nx{flex:none;width:24px;height:24px;border:0;border-radius:50%;background:rgba(127,127,127,.3);color:inherit;font:inherit;font-size:.75rem;font-weight:900;cursor:pointer;touch-action:manipulation}",
      // «⏩ Avanti» a maggioranza nella rivelazione
      ".lu-quanti{margin-left:8px;font-size:.78em;opacity:.7}.lu-btn.fatto:disabled{opacity:.8}",
      ".lu.scrive .lu-testa,.lu.scrive .lu-gente,.lu.scrive .lu-fondo,.lu.scrive .lu-parola.pensa{display:none}.lu.scrive .lu-dial{min-height:80px}",
      "@media(max-height:700px){.lu{gap:5px}.lu-testa{min-height:34px}.lu-av{width:34px;height:34px}.lu-btn{min-height:44px}.lu-btn.piccolo{min-height:36px}.lu-btn.parola{min-height:40px}.lu-carta{min-height:42px}.lu-gente{max-height:48px}.lu-p{padding:1px 7px 1px 1px}.lu-p img{width:18px;height:18px}.lu-est{min-height:30px}.lu-fondo{min-height:36px}}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Stessa Lunghezza d'Onda", icona: "📡",
    descrizione: "Il sensitivo sa dov'è il bersaglio sulla scala, gli altri muovono la lancetta per trovarlo. Indovina cosa pensano i tuoi amici!",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    modi: [{ modo: "telefono", icona: "📱", nome: "Sullo stesso telefono", sotto: "Il telefono in mezzo al tavolo, tutti intorno", amici: true, min: 2 }],
    postiOnline: MAX,
    riassunto: function (imp) {
      var i = impNorm(imp), tutti = tuttiTemi().length;
      var dom = { cosa: "Cosa ne pensi?", classico: "Classico", misto: "Misto" }[i.domande];
      var form = i.formula === "squadre" ? "a squadre fino a " + i.traguardo : i.formula === "insieme" ? "tutti insieme" : "ognuno per sé, " + (i.giri === 1 ? "1 giro" : i.giri + " giri");
      var temi = i.temi.length >= tutti ? "tutti i temi" : i.temi.length + " temi";
      var n = i.nostre.length, nostre = n && i.nostreModo !== "no" ? " · 📝 " + fmtN(n) + (n === 1 ? " scala vostra" : " scale vostre") + (i.nostreModo === "solo" ? " (solo quelle)" : " (mescolate)") : "";
      return dom + " · " + form + (!imp || imp.modo !== "telefono" ? " · " + i.tempo + " s" : "") + " · " + temi + (i.famosi ? "" : " · senza famosi") + nostre;
    },
    regole: [
      "A turno uno è il <b>sensitivo</b>: solo lui sa dov'è il <b>bersaglio</b> sulla scala (es. <b>Freddo ←→ Caldo</b>).",
      "<b>🤔 Cosa ne pensi?</b>: esce una parola pronta (o la scrive lui) e il sensitivo, di nascosto, la mette dove pensa <b>lui</b>. <b>🎯 Classico</b>: il bersaglio è a caso e il sensitivo inventa una parola che stia proprio lì.",
      "Gli altri spostano la <b>lancetta</b> dove credono che sia il bersaglio: <b>4 punti</b> al centro, poi <b>3</b> e <b>2</b>. Il sensitivo non può aiutare!",
      "<b>A squadre</b>: la squadra del sensitivo muove una lancetta comune e conferma con «Ci siamo»; l'altra squadra scommette se il bersaglio è <b>più a sinistra o più a destra</b> (+1). Centro ma ancora dietro? Si rigioca!",
      "<b>Ognuno per sé</b> (anche in meno di 4): ognuno ha la sua lancetta; il sensitivo prende la media dei punti degli altri.",
      "<b>Sullo stesso telefono</b>: il telefono sta in mezzo al tavolo. A squadre, oppure <b>tutti insieme</b> contro il gioco per 7 turni.",
      "📝 <b>Le nostre scale</b>: nelle regole (⚙️) l'host scrive le scale del vostro gruppo, una per riga (es. <b>Pizza al ristorante ↔ Pizza a casa</b>). Restano sul suo profilo e si giocano <b>mescolate</b> a quelle del gioco (circa un turno su 3), oppure <b>solo quelle</b>. In partita hanno la firma «📝 della compagnia» e non si ripetono.",
      "Online, dopo la rivelazione si va avanti da soli col conto, oppure subito se più di metà di chi gioca tocca <b>«⏩ Avanti»</b>."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, loc = !!aiuti.modo && aiuti.modo !== "online";
      var i0 = impNorm(dove);
      dove.domande = i0.domande; dove.traguardo = i0.traguardo; dove.giri = i0.giri; dove.tempo = i0.tempo; dove.temi = i0.temi.slice(); dove.famosi = i0.famosi;
      dove.formula = loc ? (dove.formula === "insieme" ? "insieme" : "squadre") : (dove.formula === "solo" ? "solo" : "squadre");
      var grTr = null, grGi = null;
      function visibili() {
        if (grTr) grTr.hidden = dove.formula !== "squadre";
        if (grGi) grGi.hidden = dove.formula !== "solo";
      }
      function gruppo(etichetta, voci, prop, conSotto) {
        var w = el("div", {});
        w.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: etichetta }));
        var g = el("div", { class: "modo-griglia", style: conSotto ? "" : "display:grid;grid-template-columns:repeat(" + voci.length + ",1fr);gap:8px" });
        voci.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[prop] === v[0] ? " attiva" : ""), style: conSotto ? "" : "justify-content:center;text-align:center;padding:12px 6px", onclick: function () {
            dove[prop] = v[0]; [].forEach.call(g.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva"); visibili();
          } }, [conSotto ? el("div", {}, [el("div", { class: "mt", text: v[1] }), el("div", { class: "ms", text: v[2] })]) : el("div", { class: "mt", text: v[1] })]);
          g.appendChild(b);
        });
        w.appendChild(g); box.appendChild(w);
        return w;
      }
      gruppo("Che domande", [["cosa", "🤔 Cosa ne pensi?", "Esce una parola: il sensitivo decide dove sta"], ["classico", "🎯 Classico", "Bersaglio a caso: il sensitivo inventa la parola"], ["misto", "🔀 Misto", "Un turno per modo"]], "domande", true);
      gruppo("Come si gioca", loc
        ? [["squadre", "👥 Due squadre", "Da 4 in su, con la scommessa"], ["insieme", "🤝 Tutti insieme", "Contro il gioco: 7 turni e il voto alla compagnia"]]
        : [["squadre", "👥 Due squadre", "Da 4 in su (in meno: ognuno per sé)"], ["solo", "🙋 Ognuno per sé", "Ognuno la sua lancetta"]], "formula", true);
      grTr = gruppo("Si vince a", [[7, "7 punti"], [10, "10 punti"], [15, "15 punti"]], "traguardo");
      if (!loc) grGi = gruppo("Giri (ognuno fa il sensitivo)", [[1, "1 giro"], [2, "2 giri"], [3, "3 giri"]], "giri");
      if (!loc) gruppo("Tempo per indovinare", [[45, "45 s"], [60, "60 s"], [90, "90 s"], [120, "120 s"]], "tempo");
      visibili();
      // i temi delle scale (l'host li sceglie prima di cominciare): almeno 3
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Temi delle scale" }));
      var gT = el("div", { class: "cat-griglia" });
      var notaT = el("div", { class: "link-avviso", hidden: "hidden", text: "Accendine almeno 3." });
      (dati().temi || []).forEach(function (te) {
        var c = el("button", { class: "cat-chip" + (dove.temi.indexOf(te.id) >= 0 ? " attiva" : ""), onclick: function () {
          var k = dove.temi.indexOf(te.id);
          if (k >= 0 && dove.temi.length <= 3) { notaT.hidden = false; return; }
          notaT.hidden = true;
          if (k >= 0) dove.temi.splice(k, 1); else dove.temi.push(te.id);
          c.classList.toggle("attiva", dove.temi.indexOf(te.id) >= 0);
        } }, [el("span", { class: "ci", text: te.icona || "📡" }), el("span", { text: te.nome }), el("span", { class: "spunta", text: "✓" })]);
        gT.appendChild(c);
      });
      box.appendChild(gT); box.appendChild(notaT);
      gruppo("Persone famose nelle parole", [[true, "👤 Sì"], [false, "🚫 No"]], "famosi");

      // 📝 LE NOSTRE SCALE: restano sul profilo e su questo telefono. Una per riga («Caldo ↔ Freddo», anche «Caldo - Freddo»),
      // così si copiano e si passano agli amici; poi si vedono una alla volta, ognuna con la sua ✕
      var lista = nostreSalvate();
      dove.nostre = lista.slice();
      dove.nostreModo = modoNostre(dove);
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:14px", text: "📝 Le nostre scale" }));
      box.appendChild(el("p", { class: "modulo-nota", text: "Le scale del vostro gruppo, una per riga: Caldo ↔ Freddo (va bene anche Caldo - Freddo). Restano salvate sul tuo profilo; con «📋 Copia» le mandi agli amici, che le incollano qui." }));
      var area = el("textarea", { class: "link-campo lu-nostre-in", rows: "2", maxlength: "4000", placeholder: "Pizza al ristorante ↔ Pizza a casa\nZio Gino calmo - Zio Gino arrabbiato", autocomplete: "off", spellcheck: "false" });
      var esito = el("p", { class: "modulo-nota lu-nostre-esito" }), elenco = el("div", { class: "lu-nostre-lista" }), conta = el("div", { class: "lu-nostre-conta" });
      var bCopia = el("button", { class: "btn btn-fantasma btn-piccolo", type: "button", text: "📋 Copia", onclick: function () {
        var testo = lista.map(scalaTesto).join("\n");
        function fatto() { bCopia.textContent = "✅ Copiate!"; setTimeout(function () { bCopia.textContent = "📋 Copia"; }, 1600); }
        try { navigator.clipboard.writeText(testo).then(fatto, function () { window.prompt("Copia le vostre scale:", testo); }); } catch (e) { window.prompt("Copia le vostre scale:", testo); }
      } });
      var bSvuota = el("button", { class: "btn btn-fantasma btn-piccolo", type: "button", text: "🗑️ Cancella tutte", onclick: function () {
        if (!lista.length) return;
        function via() { lista = []; salva(); disegnaLista(); }
        if (window.SG && SG.conferma) SG.conferma("Cancellare tutte le " + fmtN(lista.length) + " scale vostre?", "Si cancellano anche dal tuo profilo.", "🗑️ Cancella", via);
        else via();
      } });
      function salva() { salvaNostre(lista); dove.nostre = lista.slice(); }   // (anche "⚙️ Regole" in saletta se ne accorge: le scale vanno all'host con le regole)
      function disegnaConta() {
        var m = dove.nostreModo, n = lista.length;
        conta.textContent = !n ? "Ancora nessuna scala vostra: si gioca con quelle del gioco." :
          (n === 1 ? "1 scala vostra" : fmtN(n) + " scale vostre") +
          (m === "no" ? " · per ora non si usano" : m === "solo" ? " · si gioca con queste (quando finiscono, il gioco aggiunge le sue)" : " · circa un turno su 3") + " · non si ripetono nella stessa partita";
      }
      function disegnaLista() {
        while (elenco.firstChild) elenco.removeChild(elenco.firstChild);
        lista.forEach(function (s, i) {
          elenco.appendChild(el("span", { class: "lu-nostra" }, [ el("span", { text: scalaTesto(s) }),
            el("button", { class: "lu-nx", type: "button", "aria-label": "Cancella " + scalaTesto(s), text: "✕", onclick: function () { lista.splice(i, 1); salva(); disegnaLista(); } }) ]));
        });
        bCopia.style.display = bSvuota.style.display = lista.length ? "" : "none";
        disegnaConta();
      }
      function aggiungi() {
        if (!String(area.value || "").trim()) return;   // (già aggiunte uscendo dal campo)
        var righe = String(area.value || "").split(/[\n;]+/), messe = 0, scartate = [];
        righe.forEach(function (r) {
          if (!r.trim()) return;
          var s = leggiScala(r);
          if (!s) { scartate.push(r.trim()); return; }
          var k = chiaveScala(s), k2 = k.split("|").reverse().join("|");
          if (lista.some(function (x) { var c = chiaveScala(x); return c === k || c === k2; })) return;   // c'è già
          if (lista.length >= MAX_NOSTRE) { scartate.push(r.trim()); return; }
          lista.push(s); messe++;
        });
        area.value = "";
        if (messe) { salva(); disegnaLista(); }
        esito.textContent = (messe ? "✅ Aggiunte: " + fmtN(messe) + ". " : "") +
          (scartate.length ? "Non valgono (servono due lati, al massimo " + MAX_LATO + " lettere l'uno): " + scartate.slice(0, 3).join(" · ") + (scartate.length > 3 ? "…" : "") : "");
      }
      box.appendChild(el("div", { class: "lu-nostre-agg" }, [ area, el("button", { class: "btn btn-primario btn-piccolo", type: "button", text: "➕ Aggiungi", onclick: aggiungi }) ]));
      area.addEventListener("blur", function () { if (area.value.trim()) aggiungi(); });   // (scritte e non aggiunte: non si perdono uscendo dal campo)
      box.appendChild(esito); box.appendChild(conta); box.appendChild(elenco);
      box.appendChild(el("div", { class: "lu-nostre-tasti" }, [ bCopia, bSvuota ]));
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Scale" }));
      var gN = el("div", { class: "modo-griglia", style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px" });
      [["solo", "📝 Solo le nostre"], ["mix", "🔀 Mescolate"], ["no", "📡 Solo del gioco"]].forEach(function (v) {
        var b = el("button", { class: "modo-chip" + (dove.nostreModo === v[0] ? " attiva" : ""), type: "button", style: "justify-content:center;text-align:center;padding:12px 4px", onclick: function () {
          dove.nostreModo = v[0]; [].forEach.call(gN.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva"); disegnaConta();
        } }, [ el("div", { class: "mt", text: v[1] }) ]);
        gN.appendChild(b);
      });
      box.appendChild(gN);
      disegnaLista();
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito (o dalla Sala)
      if ((t.impostazioni || {}).modo === "online") return host(t);
      return locale(t);
    }
  });
})();
