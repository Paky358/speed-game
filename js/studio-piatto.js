/* =========================================================
   📺 LO STUDIO SPENTO (11 nov 2026, chat «I giochi senza lo studio»; il proprietario: «rimuoviamo anche lo studio… così tutto è più fluido»).
   Lo stesso SGStudio di js/studio.js (i giochi lo usano allo stesso modo), ma SENZA scena: niente pubblico, podi, avatar in piedi,
   telecamera, parete LED, fari, sigla lunga né musichetta. La schermata del gioco (S.sch, quella che prima stava sul maxischermo)
   prende tutto lo schermo; in alto i punteggi (faccina piccola, nome, punti: una fila fino a 4, poi due).
   All'inizio una presentazione veloce di chi gioca, alla fine chi vince; poi il gioco mostra la sua classifica coi tasti di sempre.
   L'INTERRUTTORE sta in js/elenco-giochi.js: pezzo("studio", "js/studio-piatto.js") = studio spento (oggi, per tutti);
   pezzo("studio", "js/studio.js") = lo studio di prima. La versione online contiene solo il file scritto lì.
   I giochi che vogliono fare qualcosa di diverso senza studio guardano SGStudio.piatto (true qui).
   ========================================================= */
(function () {
  "use strict";

  // ---- suoni del pubblico (applauso, "ohhh", rullo di tamburi, fanfara) ----
  var AC = null;
  function ctx() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} return AC; }
  function beep(freqs, dur, tipo) {
    var c = ctx(); if (!c) return;
    try {
      var t0 = c.currentTime;
      freqs.forEach(function (f, i) {
        var o = c.createOscillator(), g = c.createGain(), s = t0 + i * (dur * 0.6);
        o.type = tipo || "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.25, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
        o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + dur);
      });
    } catch (e) {}
  }
  // i suoni semplici di prima: servono finché quelli veri non sono pronti (o se il telefono non li sa preparare)
  function applausoSemplice(vol) {
    var c = ctx(); if (!c) return;
    try {
      var buf = rumore(c, 0.05);
      for (var i = 0; i < 70; i++) {
        var t0 = c.currentTime + Math.random() * 1.8, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        s.buffer = buf; f.type = "bandpass"; f.frequency.value = 900 + Math.random() * 1700; f.Q.value = 1.3;
        g.gain.setValueAtTime((0.06 + Math.random() * 0.1) * (vol || 1) * (1 - (t0 - c.currentTime) / 2.4), t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t0); s.stop(t0 + 0.06);
      }
    } catch (e) {}
  }
  function ohhSemplice() {
    var c = ctx(); if (!c) return;
    try {
      [0, 7].forEach(function (d) {
        var t0 = c.currentTime, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(250 + d, t0); o.frequency.exponentialRampToValueAtTime(170 + d, t0 + 0.9);
        f.type = "lowpass"; f.frequency.value = 650;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1);
        o.connect(f); f.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 1.05);
      });
    } catch (e) {}
  }
  // ---- i suoni veri del pubblico (applauso pieno, ovazione coi fischi, "ohhh") si preparano una volta sola, poi si suonano e basta ----
  var BUF = {};
  function preparaSuoni() {
    var c = ctx(), OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (preparaSuoni.fatto || !c || !OAC) return;
    preparaSuoni.fatto = true;
    rendi(OAC, c.sampleRate, 3.4, function (o) { folla(o, 3.4, 320, false); }, "applauso");
    rendi(OAC, c.sampleRate, 4.4, function (o) { folla(o, 4.4, 520, true); }, "ovazione");
    rendi(OAC, c.sampleRate, 1.5, ohhFolla, "ohh");
  }
  function rendi(OAC, sr, dur, costruisci, nome) {
    try {
      var o = new OAC(2, Math.ceil(sr * dur), sr);
      costruisci(o);
      o.oncomplete = function (e) { if (e && e.renderedBuffer) BUF[nome] = e.renderedBuffer; };
      var p = o.startRendering();
      if (p && p.then) p.then(function (b) { BUF[nome] = b; }, function () {});
    } catch (e) {}
  }
  function pan(c, out, v) { if (!c.createStereoPanner) return out; var p = c.createStereoPanner(); p.pan.value = v; p.connect(out); return p; }
  // un applauso vero: centinaia di battiti di mani sparsi a destra e a sinistra, più il fruscio della gente
  function folla(c, dur, n, grande) {
    var out = c.createGain(); out.gain.value = grande ? 1 : 0.9; out.connect(c.destination);
    var clap = rumore(c, 0.035), fondo = rumore(c, dur, true), tiene = dur * (grande ? 0.5 : 0.42);
    function forza(t) { return Math.min(1, t / 0.16) * (t < tiene ? 1 : Math.pow(Math.max(0, 1 - (t - tiene) / (dur - tiene)), 1.6)); }
    for (var k = 0; k < n; k++) {
      var t = Math.random() * dur * 0.95, e = forza(t); if (e < 0.04) continue;
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = clap; s.playbackRate.value = 0.75 + Math.random() * 0.6;
      f.type = "bandpass"; f.frequency.value = 650 + Math.random() * 2100; f.Q.value = 0.7 + Math.random() * 0.9;
      g.gain.setValueAtTime((0.1 + Math.random() * 0.2) * e, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.018 + Math.random() * 0.03);
      s.connect(f); f.connect(g); g.connect(pan(c, out, Math.random() * 1.8 - 0.9));
      s.start(t); s.stop(t + 0.07);
    }
    var sf = c.createBufferSource(), ff = c.createBiquadFilter(), gf = c.createGain();
    sf.buffer = fondo; ff.type = "bandpass"; ff.frequency.value = 1500; ff.Q.value = 0.45;
    gf.gain.setValueAtTime(0.0001, 0); gf.gain.linearRampToValueAtTime(0.07, 0.18); gf.gain.setValueAtTime(0.07, tiene); gf.gain.linearRampToValueAtTime(0.0001, dur);
    sf.connect(ff); ff.connect(gf); gf.connect(out); sf.start(0);
    if (grande) [0.3, 1.15, 2.1].forEach(function (t0, i) { fischio(c, out, t0 + Math.random() * 0.25, i % 2 ? 0.7 : -0.6); });
  }
  function fischio(c, out, t0, p) {   // il fischio di chi fa il tifo
    var o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(1800, t0); o.frequency.linearRampToValueAtTime(2800, t0 + 0.12); o.frequency.setValueAtTime(2200, t0 + 0.2); o.frequency.linearRampToValueAtTime(2900, t0 + 0.5);
    lfo.frequency.value = 7; lg.gain.value = 35; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.04); g.gain.setValueAtTime(0.012, t0 + 0.16);
    g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.24); g.gain.setValueAtTime(0.045, t0 + 0.46); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    o.connect(g); g.connect(pan(c, out, p)); o.start(t0); o.stop(t0 + 0.62); lfo.start(t0); lfo.stop(t0 + 0.62);
  }
  function ohhFolla(c) {   // "ohhh" deluso: tante voci che scendono insieme
    var out = c.createGain(); out.gain.value = 0.9; out.connect(c.destination);
    for (var v = 0; v < 10; v++) {
      var f0 = 140 + Math.random() * 190, t0 = Math.random() * 0.15, o = c.createOscillator(), b1 = c.createBiquadFilter(), b2 = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(f0 * 1.06, t0); o.frequency.exponentialRampToValueAtTime(f0 * 0.74, t0 + 1.15);
      lfo.frequency.value = 4.5 + Math.random() * 2; lg.gain.value = f0 * 0.015; lfo.connect(lg); lg.connect(o.frequency);
      b1.type = "bandpass"; b1.frequency.value = 480 + Math.random() * 120; b1.Q.value = 3;   // la "o"
      b2.type = "lowpass"; b2.frequency.value = 1300;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.2); g.gain.setValueAtTime(0.06, t0 + 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3);
      o.connect(b1); b1.connect(b2); b2.connect(g); g.connect(pan(c, out, Math.random() * 1.4 - 0.7));
      o.start(t0); o.stop(t0 + 1.35); lfo.start(t0); lfo.stop(t0 + 1.35);
    }
  }
  function suonaBuf(nome, vol) {
    var c = ctx(), b = BUF[nome]; if (!c || !b) return false;
    try {
      var s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; s.playbackRate.value = 0.94 + Math.random() * 0.12; g.gain.value = vol == null ? 1 : vol;
      s.connect(g); g.connect(c.destination); s.start(); return true;
    } catch (e) { return false; }
  }

  // ---- niente musichetta: era la musica di sottofondo dello studio (suonata al momento, sempre accesa: lavoro in più per il telefono) ----
  var Musica = { avvia: function () {}, ferma: function () {}, attiva: function () {}, accesa: function () { return false; }, abbassa: function () {}, battito: function () { return 0; } };
  var FX = {
    // applauso del pubblico: quanto = "forte" (ovazione coi fischi, per chi vince) o "piano" (un applauso di cortesia)
    applauso: function (quanto) {
      Musica.abbassa(quanto === "piano" ? 1.6 : 2.8);
      var vol = quanto === "piano" ? 0.45 : 1;
      if (!suonaBuf(quanto === "forte" ? "ovazione" : "applauso", vol)) applausoSemplice(vol);
    },
    // "ohhh" deluso del pubblico
    ohh: function () { Musica.abbassa(1.4); if (!suonaBuf("ohh", 1)) ohhSemplice(); },
    // rullo di tamburo prima della rivelazione
    rullo: function (dur) {
      var c = ctx(); if (!c) return;
      dur = dur || 1.1; Musica.abbassa(dur + 0.6);
      try {
        var buf = rumore(c, 0.04);
        for (var x = 0; x < dur; x += 0.045) {
          var t0 = c.currentTime + x, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
          s.buffer = buf; f.type = "lowpass"; f.frequency.value = 520;
          g.gain.setValueAtTime(0.05 + 0.2 * (x / dur), t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
          s.connect(f); f.connect(g); g.connect(c.destination); s.start(t0); s.stop(t0 + 0.045);
        }
      } catch (e) {}
    },
    fanfara: function () { Musica.abbassa(1.6); beep([660, 880, 1046, 1318], 0.22, "triangle"); try { if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 200]); } catch (e) {} }
  };
  function rumore(c, dur, piatto) {   // rumore bianco (piatto, oppure che si spegne: il colpo di un battito)
    var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (piatto ? 1 : 1 - i / n);
    return b;
  }

  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  var cacheAv = {};
  var FACCE = { esulta: { occhi: "felici", sopracc: "alzate", bocca: "sorrisone" }, triste: { occhi: "dolci", sopracc: "preoccupate", bocca: "smorfia" },
    pensa: { occhi: "assonnati", sopracc: "alzate", bocca: "neutro" }, paura: { occhi: "grandi", sopracc: "preoccupate", bocca: "nervoso" },
    esploso: { occhi: "chiusi", sopracc: "preoccupate", bocca: "o" },
    arrabbiato: { occhi: "tondi", sopracc: "arrabbiate", bocca: "nervoso" },   // il capo quando la squadra sbaglia
    evviva: { occhi: "felici", sopracc: "alzate", bocca: "risata" } };          // esultanza col braccio alzato
  var BRACCIA = { evviva: "uno" };   // facce che alzano anche il braccio
  // l'avatar di un giocatore: quello che ha mandato (online), il mio profilo se è il mio nome, sennò uno fisso dal nome
  function avatarDi(g, faccia) {
    if (!window.SGOmino || !g) return "";
    var cfg = avatarValido(g.omino);
    if (!cfg) { var p = window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo(); cfg = (p && p.omino && p.nome === g.nome) ? p.omino : SGOmino.casuale(g.nome || "?"); }
    if (faccia && FACCE[faccia]) { var c2 = {}, n; for (n in cfg) c2[n] = cfg[n]; for (n in FACCE[faccia]) c2[n] = FACCE[faccia][n]; cfg = c2; }
    var k = JSON.stringify(cfg);
    if (faccia && BRACCIA[faccia]) k += "|" + BRACCIA[faccia];
    if (!cacheAv[k]) { try { cacheAv[k] = SGOmino.svg(cfg, { busto: true, braccia: BRACCIA[faccia] }); } catch (e) { cacheAv[k] = ""; } }
    return cacheAv[k];
  }

  function riduci() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function coriandoli(quanti, colori) {
    if (riduci()) return;   // «riduci movimento»: niente coriandoli
    assicuraStileStudio();
    var c = document.createElement("div"); c.className = "st-coriandoli";
    var col = colori || ["#ffd43b", "#37d47e", "#4dabf7", "#ff6b6b", "#cc5de8", "#fff"];
    for (var i = 0; i < (quanti || 40); i++) {
      var p = document.createElement("i");
      p.style.left = (Math.random() * 100) + "%";
      p.style.background = col[i % col.length];
      p.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
      p.style.setProperty("--r", (Math.random() * 720 - 360) + "deg");
      p.style.animationDelay = (Math.random() * (quanti > 40 ? 1.3 : 0.4)) + "s";
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, quanti > 40 ? 4200 : 3200);
  }
  // ---- le faccine dei punteggi come immagini piccole (un disegno per faccia, fatto una volta e poi solo copiato) ----
  // Gli avatar sono disegni pesanti: se ne prepara UNO per fotogramma, mai tutti insieme (lo schermo non si ferma).
  var cacheImg = {}, codaImg = [], codaVa = false;
  function immagine(svg, cb) {
    if (!svg) return;
    var e = cacheImg[svg];
    if (e && e.ok) { if (cb) cb(e.img); return; }
    if (!e) {
      e = cacheImg[svg] = { img: new Image(), ok: false, cbs: [] };
      codaImg.push(function () {
        e.img.onload = function () { e.ok = true; var l = e.cbs; e.cbs = []; l.forEach(function (c) { try { c(e.img); } catch (x) {} }); };
        e.img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", "<svg width='178' height='182' "));
      });
      giraCoda();
    }
    if (cb) e.cbs.push(cb);
  }
  function giraCoda() {
    if (codaVa) return; codaVa = true;
    (function uno() {
      var f = codaImg.shift();
      if (!f) { codaVa = false; return; }
      try { f(); } catch (x) {}
      setTimeout(function () { requestAnimationFrame(uno); }, 30);
    })();
  }
  // disegna la faccina su una tela: "testa" = solo il viso (i punteggi), altrimenti il mezzo busto intero
  function disegnaFaccia(cv, img, testa, grigio) {
    var x = cv.getContext("2d"), w = cv.width, h = cv.height;
    x.clearRect(0, 0, w, h);
    if (testa) x.drawImage(img, 0.17 * 178, 0.02 * 182, 0.66 * 178, 0.66 * 178, 0, 0, w, h);
    else x.drawImage(img, 0, 0, w, h);
    if (grigio) {   // chi è fuori: in bianco e nero (disegnato qui una volta: un filtro peserebbe a ogni fotogramma)
      x.save(); x.globalCompositeOperation = "saturation"; x.fillStyle = "#808080"; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = "destination-in"; if (testa) x.drawImage(img, 0.17 * 178, 0.02 * 182, 0.66 * 178, 0.66 * 178, 0, 0, w, h); else x.drawImage(img, 0, 0, w, h);
      x.restore();
    }
  }
  function telaFaccia(g, faccia, px, testa) {   // una tela con la faccina (arriva quando è pronta)
    var cv = document.createElement("canvas"); cv.width = px; cv.height = testa ? px : Math.round(px * 182 / 178);
    immagine(avatarDi(g, faccia), function (img) { disegnaFaccia(cv, img, testa, false); });
    return cv;
  }

  var STACCO = 1400;   // ms di stacco su chi gioca prima che parta il suo tempo (online l'host lo aggiunge al timer)
  function durataApertura(n) { return 2300 + 140 * Math.min(10, n || 0); }   // la presentazione di chi gioca: veloce
  var ST_COL = ["#ffd43b", "#4dabf7", "#ff6b6b", "#51cf66", "#cc5de8", "#ff922b", "#20c997", "#f783ac", "#a9e34b", "#74c0fc"];
  var TEMA_BASE = ["#ff2d95", "#8b5cff", "#3fd8ff"];
  var TEMI_STUDIO = [
    [/ruota/i, ["#ffb02e", "#ff4f6d", "#ffe066"]], [/patata/i, ["#ff7a2e", "#ff2d55", "#ffc247"]], [/prezzo/i, ["#ffc247", "#ff2d95", "#3fd8ff"]],
    [/balla/i, ["#3fd8ff", "#8b5cff", "#ff2d95"]], [/nomi/i, ["#3ee0a8", "#3fd8ff", "#8b5cff"]], [/ordine/i, ["#ff4f6d", "#8b5cff", "#4f9dff"]]
  ];
  function temaDi(titolo) { for (var i = 0; i < TEMI_STUDIO.length; i++) if (TEMI_STUDIO[i][0].test(titolo || "")) return TEMI_STUDIO[i][1]; return TEMA_BASE; }
  function dorme(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function vuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function punti(n) { return (n < 0 ? "−" : "") + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }   // cifre col punto: 1.500

  function assicuraStileStudio() {
    if (document.getElementById("sg-studio-css")) return;
    var st = document.createElement("style"); st.id = "sg-studio-css";
    // Niente scena: la schermata del gioco prende tutto lo spazio, in alto i punteggi (faccina, nome, punti).
    // Le animazioni muovono SOLO transform e opacity.
    st.textContent = [
      ".schermata.st-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:var(--o-fondo,#0d1020);animation:none}",
      ".schermata.st-piena>.testa,.schermata.st-piena>.piede{display:none}",
      ".schermata.st-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".st-vista{position:relative;width:100%;max-width:520px;margin:0 auto;height:var(--alt,100dvh);overflow:hidden;user-select:none;-webkit-user-select:none;",
        "background:radial-gradient(120% 38% at 50% 0%,rgba(224,34,90,.10) 0%,rgba(224,34,90,0) 100%),radial-gradient(130% 60% at 50% 0%,#1a1f3d 0%,#121630 55%,#0b0d1c 100%)}",
      ".st-scena{position:absolute;inset:0;display:flex;flex-direction:column;will-change:transform}",
      ".st-mondo{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:8}",   // (sopra i punteggi: es. la bomba della Patata)
      ".st-mondo>*{position:absolute;pointer-events:none}",
      // i punteggi in alto: una fila fino a 4, poi due
      ".stp-punti{flex:0 0 auto;display:flex;flex-direction:column;gap:5px;padding:calc(6px + env(safe-area-inset-top)) 6px 0;position:relative;z-index:7}",
      ".stp-punti.via{display:none}",
      ".stp-punti.riga .stp-riga{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}.stp-punti.riga .stp-riga::-webkit-scrollbar{display:none}",
      ".stp-punti.riga .stp-chip{flex:1 0 84px;max-width:150px}.stp-punti.riga .stp-esci{position:sticky;left:0;z-index:3}",
      ".stp-punti.grandi .stp-chip{height:54px;gap:7px;padding-left:5px;border-radius:15px}.stp-punti.grandi .stp-chip canvas{width:42px;height:42px}",
      ".stp-punti.grandi .stp-chip .n{font-size:13px;color:var(--o-testo)}.stp-punti.grandi .stp-chip .p{font-size:14px;color:var(--o-tenue)}.stp-punti.grandi .stp-esci{height:54px}",
      ".stp-riga{display:flex;gap:5px;min-width:0}",
      ".stp-chip{position:relative;flex:1 1 0;min-width:0;display:flex;align-items:center;gap:5px;height:40px;padding:0 6px 0 3px;border-radius:13px;",
        "background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,0)),var(--o-carta,rgba(22,27,50,.72));box-shadow:inset 0 0 0 1px var(--o-filo,rgba(255,255,255,.1));",
        "color:var(--o-testo,#f4f5fb);-webkit-tap-highlight-color:transparent}",
      ".stp-chip canvas{flex:0 0 auto;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.06);box-shadow:0 0 0 2px var(--col)}",
      ".stp-chip .tx{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;line-height:1.08}",
      ".stp-chip .n{font-size:11px;font-weight:700;color:var(--o-tenue,#a6acc8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".stp-chip .p{font-size:15px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}",
      ".stp-chip .p.neg{color:#ff8d98}.stp-chip .p.testo{font-size:12px;font-weight:800;letter-spacing:-.01em}",
      ".stp-chip.tu .n{color:var(--o-testo,#fff)}",
      ".stp-chip.acceso{box-shadow:inset 0 0 0 2px var(--col),0 0 18px -4px var(--col);background-color:rgba(255,255,255,.07)}",
      ".stp-chip.fuori{opacity:.42}",
      ".stp-chip.fuoco{animation:stpFuoco .5s ease-out}",
      "@keyframes stpFuoco{0%{transform:scale(1)}35%{transform:scale(1.06)}100%{transform:scale(1)}}",
      ".stp-chip.tocca{cursor:pointer;touch-action:manipulation}",
      ".stp-chip .anello{position:absolute;inset:-3px;border-radius:15px;border:2.5px solid #6ff0a6;opacity:0;pointer-events:none}",
      ".stp-chip.tocca .anello{opacity:1;will-change:transform,opacity;animation:stAnello 1s ease-in-out infinite}",
      "@keyframes stAnello{0%,100%{transform:scale(.97);opacity:.55}50%{transform:scale(1.02);opacity:1}}",
      ".stp-chip .lp{position:absolute;inset:0;border-radius:13px;background:#ff3b30;opacity:0;pointer-events:none}",
      ".stp-chip .lp.on{animation:stpLp .9s ease-out}",
      "@keyframes stpLp{0%{opacity:.8}100%{opacity:0}}",
      ".stp-chip .delta{position:absolute;left:50%;top:100%;z-index:3;font-weight:900;font-size:17px;white-space:nowrap;pointer-events:none;opacity:0;text-shadow:0 2px 0 rgba(0,0,0,.45);transform:translate(-50%,-30%)}",
      ".stp-chip .delta.on{animation:stDelta 1.5s ease-out}",
      "@keyframes stDelta{0%{opacity:0;transform:translate(-50%,-60%) scale(.6)}15%{opacity:1;transform:translate(-50%,0) scale(1.15)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,24%)}}",
      ".stp-chip .cart{position:absolute;right:-3px;top:-5px;z-index:2;min-width:22px;height:22px;padding:0 4px;border-radius:8px;display:flex;align-items:center;justify-content:center;",
        "font-size:13px;font-weight:900;background:#f4f1ff;color:#2a1d6e;box-shadow:0 2px 6px rgba(0,0,0,.4);opacity:0;transform:scale(.3);transition:opacity .2s,transform .3s cubic-bezier(.3,1.5,.5,1)}",
      ".stp-chip .cart.su{opacity:1;transform:none}",
      ".stp-chip .cart .f.r,.stp-chip .cart.gira .f:not(.r){display:none}.stp-chip .cart.gira .f.r{display:inline}",
      ".stp-chip .cart.si{background:#6ff0a6} .stp-chip .cart.no{background:#ff95a0}",
      ".stp-esci{flex:0 0 auto;width:34px;height:40px;border-radius:13px;border:0;background:var(--o-carta,rgba(22,27,50,.72));box-shadow:inset 0 0 0 1px var(--o-filo,rgba(255,255,255,.1));",
        "color:var(--o-testo,#fff);font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer;padding:0}",
      ".stp-punti.via + .st-schermo .stp-esci2{display:block}",
      ".st-esci{position:absolute;left:8px;top:calc(8px + env(safe-area-inset-top));z-index:25;width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.4);color:#fff;font:inherit;font-size:1.25rem;font-weight:900;cursor:pointer}",
      // la schermata del gioco
      ".st-schermo{position:relative;flex:1 1 auto;min-height:0}",
      ".st-schermo.via{display:none}",
      ".st-sch-in{position:absolute;inset:0;display:flex;flex-direction:column;padding:8px 12px 10px}",
      ".st-vista.con-barra .st-sch-in{padding-bottom:104px}",
      ".st-sch-in .tl-hud{flex:0 0 auto;align-items:center}",
      ".st-sch-in .tl-scroll{-webkit-mask:none;mask:none}",
      ".st-sch-in .tl-ev .card{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(255,255,255,.1)}",
      ".st-idle{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px}",
      ".st-idle .logo{font-size:40px;font-weight:800;line-height:1.03;letter-spacing:.02em;color:#fff;text-shadow:0 3px 0 #a3123f,0 0 24px rgba(255,79,134,.55)}",
      ".st-idle .stelle{color:var(--n-monete,#ffc247);letter-spacing:.35em;font-size:22px}",
      ".st-idle .sotto{font-size:13px;font-weight:800;letter-spacing:.32em;text-transform:uppercase;color:var(--o-tenue)}",
      ".st-sch-in .tl-esito{justify-content:center;padding-bottom:40px}",
      ".st-sch-in .tl-flip{width:min(310px,88%);height:230px}",
      ".st-raggi{position:absolute;left:50%;top:38%;width:180%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;opacity:0;will-change:transform;animation:stRaggi 14s linear infinite,stAppari .6s ease 1.3s forwards}",
      "@keyframes stRaggi{to{transform:translate(-50%,-50%) rotate(360deg)}}",
      "@keyframes stAppari{to{opacity:1}}",
      // chi gioca (all'inizio) e chi vince (alla fine): una schermata semplice e veloce
      ".stp-intro{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;min-height:0}",
      ".stp-intro .logo{font-size:34px;font-weight:800;line-height:1.03;color:#fff;text-shadow:0 3px 0 #a3123f,0 0 22px rgba(255,79,134,.5)}",
      ".stp-intro .chi{font-size:13px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:var(--o-tenue)}",
      ".stp-gente{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 10px;max-width:100%}",
      ".stp-uno{width:72px;display:flex;flex-direction:column;align-items:center;gap:4px;opacity:0;transform:translateY(14px) scale(.8);animation:stpEntra .42s cubic-bezier(.3,1.4,.5,1) forwards}",
      ".stp-uno canvas{width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.06);box-shadow:0 0 0 3px var(--col)}",
      ".stp-uno b{font-size:12.5px;font-weight:800;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".stp-uno.tu b{color:var(--o-oro-testo,#ffd36b)}",
      "@keyframes stpEntra{to{opacity:1;transform:none}}",
      ".stp-vince{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center}",
      ".stp-vince .coppa{font-size:56px;line-height:1;opacity:0;transform:scale(.4);animation:stpEntra .5s cubic-bezier(.3,1.5,.5,1) forwards}",
      ".stp-vince canvas{width:128px;height:131px;opacity:0;transform:scale(.6);animation:stpEntra .5s cubic-bezier(.3,1.4,.5,1) .15s forwards}",
      ".stp-vince .chi{font-size:30px;font-weight:900;line-height:1.1;opacity:0;animation:stpEntra .4s ease .3s forwards}",
      ".stp-vince .sotto{font-size:15px;font-weight:700;color:var(--o-tenue);opacity:0;animation:stpEntra .4s ease .45s forwards}",
      // sovrimpressioni
      ".st-terzo{position:absolute;left:12px;bottom:calc(104px + env(safe-area-inset-bottom));z-index:22;display:flex;align-items:center;gap:10px;max-width:calc(100% - 24px);padding:6px 16px 6px 6px;",
        "border-radius:16px;border-left:7px solid var(--col,#ff3ea5);background:linear-gradient(100deg,#1d2343,var(--o-carta-piena));color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),0 10px 24px -10px rgba(0,0,0,.85);",
        "transform:translateX(-120%);transition:transform .4s cubic-bezier(.3,1.3,.5,1)}",
      ".st-terzo.on{transform:none}",
      ".st-terzo .fac{width:42px;height:42px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.06);flex:0 0 auto}",
      ".st-terzo .fac canvas{width:100%;height:100%;display:block}",
      ".st-terzo .ic{font-size:26px;flex:0 0 auto}",
      ".st-terzo .tx{font-weight:900;font-size:17px;line-height:1.15;min-width:0}",
      ".st-terzo .tx small{display:block;font-size:12px;font-weight:700;color:var(--o-tenue)}",
      ".st-barra{position:absolute;left:0;right:0;bottom:0;z-index:22;display:flex;flex-direction:column;gap:8px;padding:12px 14px calc(14px + env(safe-area-inset-bottom));",
        "background:linear-gradient(rgba(13,16,32,0),rgba(13,16,32,.94) 36%);transform:translateY(110%);transition:transform .3s}",
      ".st-barra.on{transform:none}",
      ".st-barra .btn{min-height:58px;font-size:1.1rem}",
      // 🌙 Notte vivace: le variabili di sempre prendono i colori della notte, così i pannelli dei giochi cambiano da soli
      ".st-vista{--sfondo:var(--o-fondo);--sfondo-2:var(--o-fondo-2);--carta:var(--o-carta);--carta-2:var(--o-carta-2);--testo:var(--o-testo);--testo-tenue:var(--o-tenue);",
        "--accento:var(--o-oro-testo);--accento-scuro:var(--o-oro);--verde:var(--o-verde);--rosso:var(--o-rosso-testo);--ombra:var(--o-ombra);font-family:var(--o-tit);color:var(--o-testo)}",
      ".st-vista :is(button,input,textarea,select){font-family:inherit}",
      ".g-ordine .st-vista{font-family:inherit}",
      ".st-vista .btn{border-radius:16px;font-weight:650;color:var(--o-testo)}",
      ".st-vista .btn:not(.btn-primario):not(.btn-verde):not(.btn-rosso):not(.btn-fantasma){background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta);",
        "box-shadow:inset 0 0 0 1px var(--o-filo),inset 0 1px 0 rgba(255,255,255,.06),0 10px 24px -14px rgba(0,0,0,.8)}",
      ".st-vista .btn-primario{background:var(--o-tasto);color:var(--o-tasto-testo);font-weight:700;text-shadow:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 10px 26px -8px rgba(229,36,95,.6)}",
      ".st-vista .btn-verde{background:var(--o-verde);color:var(--o-verde-testo);box-shadow:0 8px 18px rgba(52,209,122,.22)}",
      ".st-vista .btn-rosso{background:var(--o-rosso);color:#fff;box-shadow:0 8px 18px rgba(214,60,74,.3)}",
      ".st-vista .btn-fantasma{color:var(--o-oro-testo)}",
      ".st-vista :is(.btn-primario,.btn-verde,.btn-rosso):disabled{opacity:1;background:var(--o-fondo-2);color:var(--o-tenue);box-shadow:inset 0 0 0 1px var(--o-filo)}",
      ".st-lampo{position:absolute;inset:0;z-index:24;background:#fff;opacity:0;pointer-events:none}",
      ".st-lampo.on{animation:stLampo .4s ease-out}",
      "@keyframes stLampo{0%{opacity:.6}100%{opacity:0}}",
      ".st-coriandoli{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden}",
      ".st-coriandoli i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;will-change:transform;animation:stCade 2.6s cubic-bezier(.2,.6,.4,1) forwards}",
      "@keyframes stCade{to{transform:translate(var(--dx),110vh) rotate(var(--r))}}",
      ".st-rullo{position:relative;overflow:hidden}",
      ".st-cella{position:absolute;left:0;top:0;width:100%;display:flex;align-items:center;justify-content:center;text-align:center;will-change:transform}",
      ".st-rullo:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(0,0,0,.34),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 70%,rgba(0,0,0,.34))}",
      ".st-nascosto{display:none!important}",
      ".stp-palco{position:absolute;inset:0;z-index:23;display:flex;flex-direction:column;padding:calc(20px + env(safe-area-inset-top)) 16px 20px;background:rgba(11,13,28,.95);opacity:0;pointer-events:none;transition:opacity .3s}",
      ".stp-palco.on{opacity:1;pointer-events:auto}",
      "@media (prefers-reduced-motion:reduce){.stp-uno,.stp-vince *{animation:none!important;opacity:1!important;transform:none!important}}"
    ].join("");
    document.head.appendChild(st);
  }

  // Crea lo «studio» (una sola volta per partita) e lo mette a schermo: la schermata del gioco (S.sch) a tutto schermo,
  // in alto i punteggi. giocatori: [{ nome, omino? }]; opz: { io (chi ha questo telefono, -1 = nessuno), esci(), punti: false (niente punteggi) }
  function creaStudio(t, giocatori, opz) {
    assicuraStileStudio();
    var el = t.el, s = t.schermata({});
    s.classList.add("st-piena");
    var vista = el("div", { class: "st-vista st-piatto" }), scena = el("div", { class: "st-scena" });
    vista.appendChild(scena);
    vista.addEventListener("scroll", function () { vista.scrollTop = 0; vista.scrollLeft = 0; });
    var S = { t: t, s: s, vista: vista, scena: scena, gioc: [], io: -1, L: [], shot: null, timer: null, piatto: true,
      titolo: opz.titolo || "", logo: opz.logo || [opz.titolo || "GAME SHOW"], onTocca: null, senzaSchermo: !!opz.senzaSchermo, file: 1 };
    S.tema = temaDi(opz.tema || S.titolo);
    function esci() {
      function via() { if (!document.body.contains(vista)) return; fermaTimer(S); opz.esci(); }
      if (window.SG && SG.conferma) SG.conferma("Uscire dalla partita?", null, "Esci", via);
      else if (window.confirm("Uscire dalla partita?")) via();
    }
    // (punti: false = niente punteggi; "grandi" = punteggi alti e larghi, da toccare: es. a chi passare la bomba della Patata)
    S.grandi = opz.punti === "grandi"; S.riga = opz.punti === "riga";   // ("riga" = tutti su una riga sola che scorre di lato)
    S.puntiEl = el("div", { class: "stp-punti" + (opz.punti === false ? " via" : "") + (S.grandi ? " grandi" : "") + (S.riga ? " riga" : "") });
    S.esciEl = el("button", { class: "stp-esci", text: "‹", "aria-label": "Esci", onclick: esci });
    S.schermo = el("div", { class: "st-schermo" + (S.senzaSchermo ? " via" : "") });
    S.sch = el("div", { class: "st-sch-in" }); S.schermo.appendChild(S.sch);
    scena.appendChild(S.puntiEl); scena.appendChild(S.schermo);
    S.mondo = el("div", { class: "st-mondo" }); scena.appendChild(S.mondo);
    if (opz.punti === false) vista.appendChild(el("button", { class: "st-esci", text: "‹", "aria-label": "Esci", onclick: esci }));   // (senza punteggi: il tasto di sempre, in alto a sinistra)
    // (pezzi che c'erano nello studio e che qualche gioco tocca: restano, ma non si vedono)
    S.fumetto = el("div", { class: "st-nascosto" }); S.rec = el("div", { class: "st-nascosto" }); vista.appendChild(S.fumetto); vista.appendChild(S.rec);
    S.terzoEl = el("div", { class: "st-terzo" }); vista.appendChild(S.terzoEl);
    S.barraEl = el("div", { class: "st-barra" }); vista.appendChild(S.barraEl);
    S.lampoEl = el("div", { class: "st-lampo" }); vista.appendChild(S.lampoEl);
    s._contenuto.appendChild(vista);
    t.mostra(s);
    S.vivo = function () { return vista.isConnected; };
    S.dopoLayout = opz.dopoLayout || null;
    S.impostaGiocatori = function (lista, io) {
      S.gioc = lista.map(function (g) { return { nome: g.nome, omino: g.omino || null, col: g.col || null }; });
      S.io = io == null ? -1 : io; costruisciPunti(S); layoutStudio(S);
    };
    S.impostaGiocatori(giocatori, opz.io);
    S.pubPronto = Promise.resolve(); S.attesaRaster = Promise.resolve(); S.rasterOk = true;
    S.shot = function () { return S.R.schermo; };
    setTimeout(preparaSuoni, 1800);   // gli applausi si preparano dopo, a partita già partita (niente scatti all'inizio)
    var toR = null;
    function suResize() {
      if (!S.vivo()) { window.removeEventListener("resize", suResize); return; }
      clearTimeout(toR); toR = setTimeout(function () { if (S.vivo()) layoutStudio(S); }, 120);
    }
    window.addEventListener("resize", suResize);
    return S;
  }
  // i punteggi: uno per giocatore (faccina, nome, punti), una fila fino a 4, poi due
  function costruisciPunti(S) {
    var el = S.t.el, n = S.gioc.length, perRiga = n <= 4 ? n : Math.ceil(n / 2), righe = [];
    if (S.grandi) perRiga = n <= 4 ? 2 : 3;   // (grandi: due o tre per riga)
    if (S.riga) perRiga = Math.max(1, n);
    var nRighe = Math.max(1, Math.ceil(n / Math.max(1, perRiga)));
    vuota(S.puntiEl); S.L = [];
    for (var r = 0; r < nRighe; r++) { var rg = el("div", { class: "stp-riga" }); righe.push(rg); S.puntiEl.appendChild(rg); }
    if (righe.length) righe[0].appendChild(S.esciEl);
    S.gioc.forEach(function (g, i) {
      var col = g.col || ST_COL[i % ST_COL.length], cv = el("canvas", { width: "64", height: "64" });
      var nome = el("span", { class: "n", text: g.nome }), pt = el("span", { class: "p", text: "0" });
      var C = el("div", { class: "stp-chip" + (i === S.io ? " tu" : "") }, [ cv, el("div", { class: "tx" }, [ nome, pt ]), el("div", { class: "cart" }, [ el("span", { class: "f", text: "?" }), el("span", { class: "f r" }) ]), el("div", { class: "delta" }), el("div", { class: "lp" }), el("div", { class: "anello" }) ]);
      C.style.setProperty("--col", col);
      // toccare un giocatore (es. per passargli la bomba): basta un tocco anche se il dito si muove un po'
      (function (C, i) {
        var giu = null, ultimo = 0;
        function scegli() { if (S.onTocca && C.classList.contains("tocca") && Date.now() - ultimo > 450) { ultimo = Date.now(); S.onTocca(i); } }
        C.addEventListener("pointerdown", function (e) { giu = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
        C.addEventListener("pointerup", function (e) { if (giu && giu.id === e.pointerId && Math.abs(e.clientX - giu.x) + Math.abs(e.clientY - giu.y) < 28) scegli(); giu = null; });
        C.addEventListener("pointercancel", function () { giu = null; });
        C.addEventListener("click", scegli);
      })(C, i);
      var X = { el: C, cv: cv, nomeEl: nome, pt: pt, cart: C.querySelector(".cart"), delta: C.querySelector(".delta"), lp: C.querySelector(".lp"),
        nome: g.nome, col: col, tu: i === S.io, disp: { t: "0", neg: false, testo: false }, valore: 0, faccia: null, grigio: false, versione: 0 };
      mettiFaccia(S, X, i);
      righe[Math.min(righe.length - 1, Math.floor(i / Math.max(1, perRiga)))].appendChild(C);
      S.L.push(X);
    });
  }
  function mettiFaccia(S, X, i) {
    var v = X.versione = (X.versione || 0) + 1, g = S.gioc[i];
    immagine(avatarDi(g, X.faccia), function (img) { if (X.versione === v) disegnaFaccia(X.cv, img, true, X.grigio); });
  }
  // le misure (per i giochi che mettono qualcosa sopra un giocatore): S.posti in coordinate della vista
  function layoutStudio(S) {
    var VW = S.vista.clientWidth || 360, VH = S.vista.clientHeight || 640, vr = S.vista.getBoundingClientRect();
    S.VW = VW; S.VH = VH; S.W = VW; S.H = VH;
    var ph = S.puntiEl.classList.contains("via") ? 0 : S.puntiEl.offsetHeight;
    S.R = { schermo: { x: 0, y: ph, w: VW, h: Math.max(0, VH - ph) } };
    S.posti = S.L.map(function (X, i) {
      var r = X.el.getBoundingClientRect();
      return { cx: r.left - vr.left + r.width / 2, top: r.top - vr.top, w: r.width, h: r.height, fila: Math.max(0, [].indexOf.call(S.puntiEl.children, X.el.parentNode)) };
    });
    S.file = S.puntiEl.children.length || 1;
    if (S.dopoLayout) try { S.dopoLayout(S); } catch (e) {}
  }

  // ---------- la «telecamera»: non c'è più. Le inquadrature finiscono subito (i giochi le aspettano come prima) ----------
  function camera(S, r, ms) { return Promise.resolve(); }
  function inquadra(S, shot, ms) { S.shot = shot; return Promise.resolve(); }
  function suSchermo(S, ms) { return inquadra(S, function () { return S.R.schermo; }, ms); }
  function largo(S, ms) { return inquadra(S, function () { return { x: 0, y: 0, w: S.W, h: S.H }; }, ms); }
  function suLeggio(S, i, ms) { fuoco(S, i); return inquadra(S, function () { var p = S.posti[i] || S.posti[0] || { cx: 0, top: 0, w: 0 }; return { x: p.cx - p.w / 2, y: p.top, w: p.w, h: p.h || 40 }; }, ms); }
  function suPubblico(S, lato, ms) { return inquadra(S, function () { return { x: 0, y: 0, w: S.W, h: S.H }; }, ms); }
  function fuoco(S, i) { var X = S.L[i]; if (!X) return; X.el.classList.remove("fuoco"); void X.el.offsetWidth; X.el.classList.add("fuoco"); }
  // la «panoramica» lungo una fila: fn(i) per ogni giocatore della fila, uno dopo l'altro (in fretta)
  async function panFila(S, fila, ms, fn) {
    var idx = []; (S.posti || []).forEach(function (p, i) { if (p.fila === fila) idx.push(i); });
    for (var k = 0; k < idx.length; k++) { if (fn) fn(idx[k]); fuoco(S, idx[k]); await dorme(90); }
  }

  // ---------- pezzi dello spettacolo ----------
  function fermaTimer(S) { if (S.timer && S.timer._stop) S.timer._stop(); S.timer = null; }
  function terzo(S, i, testo, sotto, ic) {
    var el = S.t.el, T = S.terzoEl; vuota(T);
    T.style.setProperty("--col", i != null && i >= 0 ? (S.L[i] ? S.L[i].col : ST_COL[i % ST_COL.length]) : "#ff3ea5");
    if (i != null && i >= 0 && S.gioc[i]) T.appendChild(el("span", { class: "fac" }, [ telaFaccia(S.gioc[i], null, 84, true) ]));
    else T.appendChild(el("span", { class: "ic", text: ic || "📺" }));
    T.appendChild(el("div", { class: "tx" }, [ el("span", { text: testo }), sotto ? el("small", { text: sotto }) : null ]));
    T.classList.remove("on"); void T.offsetWidth; T.classList.add("on");
  }
  function viaTerzo(S) { S.terzoEl.classList.remove("on"); }
  function barra(S, nodi) { vuota(S.barraEl); nodi.forEach(function (n) { if (n) S.barraEl.appendChild(n); }); S.barraEl.classList.add("on"); S.vista.classList.add("con-barra"); }
  function viaBarra(S) { S.barraEl.classList.remove("on"); S.vista.classList.remove("con-barra"); }
  function aspettaTasto(S, testo) {
    return new Promise(function (fine) {
      barra(S, [ S.t.el("button", { class: "btn btn-primario", text: testo, onclick: function () { viaBarra(S); fine(); } }) ]);
    });
  }
  function lampo(S) { var l = S.lampoEl; l.classList.remove("on"); void l.offsetWidth; l.classList.add("on"); }
  function accendi(S, i, on) { var X = S.L[i]; if (X) X.el.classList.toggle("acceso", !!on); }
  function accendiSolo(S, i) { S.L.forEach(function (X, k) { X.el.classList.toggle("acceso", k === i); }); inVista(S, i); }
  // (punteggi su una riga che scorre: chi è acceso si porta a vista)
  function inVista(S, i) {
    var X = S.L[i]; if (!S.riga || !X) return; var r = X.el.parentNode; if (!r) return;
    var a = X.el.offsetLeft, b = a + X.el.offsetWidth, l = r.scrollLeft, w = r.clientWidth;
    if (a < l + 40) r.scrollLeft = Math.max(0, a - 40); else if (b > l + w) r.scrollLeft = b - w + 4;
  }
  function faccia(S, i, f) { var X = S.L[i]; if (!X || X.faccia === (f || null)) return; X.faccia = f || null; mettiFaccia(S, X, i); }
  function tutteNormali(S) { S.L.forEach(function (X, i) { faccia(S, i, null); }); }
  function scriviDisp(X) { if (X.pt.textContent !== X.disp.t) X.pt.textContent = X.disp.t; X.pt.classList.toggle("neg", !!X.disp.neg); X.pt.classList.toggle("testo", !!X.disp.testo); }
  function puntiLeggio(S, i, valore, delta) {
    var X = S.L[i]; if (!X) return;
    var da = X.valore; X.valore = valore;
    function scrivi(v) { var tx = punti(v) + (X.dopo || ""); if (X.disp && !X.disp.testo && X.disp.t === tx) return; X.disp = { t: tx, neg: v < 0, testo: false }; scriviDisp(X); }   // (X.dopo: un pezzo dopo il numero, es. «/5»)
    if (!delta) return scrivi(valore);
    X.delta.textContent = (delta > 0 ? "+" : "−") + punti(Math.abs(delta));
    X.delta.style.color = delta > 0 ? "#6ff0a6" : "#ff8d98";
    X.delta.classList.remove("on"); void X.delta.offsetWidth; X.delta.classList.add("on");
    var t0 = performance.now();
    (function passo() { if (X.valore !== valore) return; var p = Math.min(1, (performance.now() - t0) / 700); scrivi(Math.round(da + (valore - da) * p)); if (p < 1) requestAnimationFrame(passo); })();
    setTimeout(function () { if (X.valore === valore) scrivi(valore); }, 800);
  }
  function cartello(S, i, stato, voto) {
    var X = S.L[i]; if (!X) return;
    // (il cartellino: davanti «?», dietro il voto; il gioco può scrivere sul retro, es. ✋ ✅ ❌, come sul cartello del leggio)
    var r = X.cart.querySelector(".f.r");
    if (stato === "giu") { X.cart.classList.remove("su", "gira", "si", "no"); return; }
    if (voto != null) { X.cart.classList.toggle("si", !!voto); X.cart.classList.toggle("no", !voto); r.textContent = voto ? "👍" : "👎"; }
    X.cart.classList.add("su");
    if (stato === "gira") X.cart.classList.add("gira");
  }
  function cartelliGiu(S) { S.L.forEach(function (X, i) { cartello(S, i, "giu"); }); }
  // il pubblico non c'è più: restano solo gli applausi e l'«ohhh» (suoni, niente disegni)
  function pubblico(S, tipo) {
    if (tipo === "ohh") FX.ohh();
    else FX.applauso(tipo === "ovazione" ? "forte" : tipo === "piano" ? "piano" : null);
  }
  function logoSchermo(S) {
    fermaTimer(S);
    var el = S.t.el; vuota(S.sch);
    var logo = el("div", { class: "logo" }); S.logo.forEach(function (r, k) { if (k) logo.appendChild(el("br")); logo.appendChild(document.createTextNode(r)); });
    S.sch.appendChild(el("div", { class: "st-idle" }, [ el("div", { class: "stelle", text: "★ ★ ★" }), logo ]));
  }

  // ---------- inizio e fine: schermate semplici e veloci ----------
  // dove si disegnano: la schermata del gioco, o (per chi non ce l'ha, come la Ruota) un velo sopra tutto
  function palco(S) {
    if (!S.senzaSchermo) { vuota(S.sch); return S.sch; }
    if (!S.palcoEl) { S.palcoEl = S.t.el("div", { class: "stp-palco" }); S.vista.appendChild(S.palcoEl); }
    vuota(S.palcoEl); S.palcoEl.classList.add("on"); return S.palcoEl;
  }
  function viaPalco(S) {   // (il velo sparisce piano, poi si svuota)
    var p = S.palcoEl; if (!p || !p.classList.contains("on")) return;
    p.classList.remove("on"); setTimeout(function () { if (!p.classList.contains("on")) vuota(p); }, 350);
  }
  // all'inizio: il nome del gioco e chi gioca (le faccine entrano una dopo l'altra), poco più di 2 secondi
  async function apertura(S) {
    viaBarra(S); fermaTimer(S); viaTerzo(S);
    var el = S.t.el, P = palco(S);
    var logo = el("div", { class: "logo" }); S.logo.forEach(function (r, k) { if (k) logo.appendChild(el("br")); logo.appendChild(document.createTextNode(r)); });
    var gente = el("div", { class: "stp-gente" });
    S.gioc.forEach(function (g, i) {
      var u = el("div", { class: "stp-uno" + (i === S.io ? " tu" : "") }, [ telaFaccia(g, "esulta", 120, true), el("b", { text: i === S.io ? g.nome + " (tu)" : g.nome }) ]);
      u.style.setProperty("--col", S.L[i] ? S.L[i].col : ST_COL[i % ST_COL.length]); u.style.animationDelay = (0.25 + i * 0.12).toFixed(2) + "s";
      gente.appendChild(u);
    });
    P.appendChild(el("div", { class: "stp-intro" }, [ logo, el("div", { class: "chi", text: S.gioc.length + " in gara" }), gente ]));
    pubblico(S, "piano");
    await dorme(durataApertura(S.gioc.length) - 300);
    accendiSolo(S, -1); viaPalco(S);
  }
  // tocca a qualcuno: il suo punteggio si accende e una scritta lo dice
  async function stacco(S, gi, sotto) {
    viaBarra(S); cartelliGiu(S); tutteNormali(S);
    accendiSolo(S, gi); fuoco(S, gi); faccia(S, gi, "pensa");
    terzo(S, gi, "Tocca a " + (S.gioc[gi] ? S.gioc[gi].nome : ""), sotto);
    await dorme(1100);
    viaTerzo(S); faccia(S, gi, null);
  }
  // alla fine: chi vince, grande, coi coriandoli (poi il gioco mostra la sua classifica coi tasti di sempre)
  async function finale(S, vinc, sotto) {
    viaBarra(S); fermaTimer(S); cartelliGiu(S); viaTerzo(S);
    var el = S.t.el, P = palco(S);
    if (vinc >= 0 && S.gioc[vinc]) {
      accendiSolo(S, vinc); faccia(S, vinc, "esulta");
      P.appendChild(el("div", { class: "stp-vince" }, [ el("div", { class: "coppa", text: "🏆" }), telaFaccia(S.gioc[vinc], "evviva", 256, false),
        el("div", { class: "chi", text: S.gioc[vinc].nome + (vinc === S.io ? " (tu)" : "") + " vince!" }), sotto ? el("div", { class: "sotto", text: sotto }) : null ]));
      FX.rullo(0.5); setTimeout(function () { if (!S.vivo()) return; pubblico(S, "ovazione"); coriandoli(); FX.fanfara(); }, 450);
      await dorme(2700);
      return;
    }
    P.appendChild(el("div", { class: "stp-vince" }, [ el("div", { class: "coppa", text: "🏁" }), el("div", { class: "chi", text: "Fine della partita!" }), sotto ? el("div", { class: "sotto", text: sotto }) : null ]));
    pubblico(S, "applauso");
    await dorme(1500);
  }

  // ---- pezzi in più per i giochi (es. la bomba della Patata) ----
  function testoLeggio(S, i, testo, neg) {
    var X = S.L[i]; if (!X) return; testo = String(testo);
    if (X.disp && X.disp.testo && X.disp.t === testo && X.disp.neg === !!neg) return;
    X.disp = { t: testo, neg: !!neg, testo: true }; scriviDisp(X);
  }
  function tocca(S, lista) { S.L.forEach(function (X, k) { X.el.classList.toggle("tocca", lista.indexOf(k) >= 0); }); }
  function fuori(S, i, on, lampo) {
    var X = S.L[i]; if (!X) return; X.el.classList.toggle("fuori", !!on);
    if (on && lampo) { X.lp.classList.remove("on"); void X.lp.offsetWidth; X.lp.classList.add("on"); }
    if (!!X.grigio !== !!on) { X.grigio = !!on; mettiFaccia(S, X, i); }
  }
  // lo schermo trema (un'esplosione): solo transform
  function scossa(S) {
    var e = S.scena, t0 = performance.now(), D = 500, id = S.scossaId = (S.scossaId || 0) + 1;
    var K = [[0, 0, 0], [0.15, -8, 4], [0.3, 7, -5], [0.45, -5, -3], [0.6, 4, 3], [0.8, -2, 1], [1, 0, 0]];
    function passo(t) {
      if (S.scossaId !== id) return;
      var u = Math.min(1, ((t || performance.now()) - t0) / D), k = 1;
      while (k < K.length - 1 && K[k][0] < u) k++;
      var a = K[k - 1], b = K[k], f = (u - a[0]) / (b[0] - a[0]); f = 1 - (1 - f) * (1 - f);
      e.style.transform = u >= 1 ? "" : "translate3d(" + (a[1] + (b[1] - a[1]) * f).toFixed(1) + "px," + (a[2] + (b[2] - a[2]) * f).toFixed(1) + "px,0)";
      if (u < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
    setTimeout(function () { if (S.scossaId === id) e.style.transform = ""; }, D + 60);
  }
  // il punto sopra il punteggio di un giocatore (in coordinate della vista)
  function sopraTesta(S, i) { var p = (S.posti || [])[i] || (S.posti || [])[0] || { cx: 0, top: 0, w: 0 }; return { x: p.cx, y: p.top, w: p.w }; }

  // raggi che girano dietro a una carta o a un risultato (già sfumati verso il bordo: niente maschere da ricalcolare)
  function raggi(S, ko) {
    var c = document.createElement("canvas"); c.className = "st-raggi"; c.width = c.height = 256;
    var x = c.getContext("2d"), m = 128, k, a, g;
    x.fillStyle = ko ? "rgba(255,93,108,.2)" : "rgba(255,230,120,.22)";
    for (k = 0; k < 18; k++) { a = (k * 20 - 90) * Math.PI / 180; x.beginPath(); x.moveTo(m, m); x.arc(m, m, 190, a, a + 8 * Math.PI / 180); x.closePath(); x.fill(); }
    g = x.createRadialGradient(m, m, 0, m, m, 181 * 0.65);
    g.addColorStop(0, "#000"); g.addColorStop(0.2 / 0.65, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in"; x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return c;
  }
  // ---- il rullo della slot machine: parte veloce e rallenta piano piano fino a fermarsi sulla voce giusta ----
  // opz: { cls, alt (altezza di una casella in px), voci (le scritte che passano), ultima (dove si ferma), durata (ms), scatto(k) a ogni casella che passa }
  // Tre caselle che si danno il cambio: a ogni scatto se ne riscrive una sola, il resto lo muove la scheda grafica.
  function rullo(S, opz) {
    var el = S.t.el, H = opz.alt, fin = el("div", { class: "st-rullo " + (opz.cls || "") }), celle = [], mostra = [null, null, null], k;
    fin.style.height = H + "px";
    for (k = 0; k < 3; k++) { var ce = el("div", { class: "st-cella" }); ce.style.height = H + "px"; fin.appendChild(ce); celle.push(ce); }
    var voci = opz.voci && opz.voci.length ? opz.voci : [opz.ultima], N = Math.max(10, Math.round(opz.durata / 140)), seq = [], prec = null;
    function pesca(no) { var v, n = 0; do { v = voci[Math.floor(Math.random() * voci.length)]; } while (voci.length > 1 && (v === no || v === prec) && ++n < 20); return v; }
    for (k = 0; k <= N + 1; k++) { seq.push(pesca(null)); prec = seq[k]; }   // mai due uguali di fila
    seq[N] = opz.ultima;
    if (seq[N - 1] === opz.ultima) seq[N - 1] = pesca(opz.ultima);
    if (seq[N + 1] === opz.ultima) seq[N + 1] = pesca(opz.ultima);
    var ora = -1;
    function posa(p) {   // p = quante caselle sono passate (con la virgola)
      var i = Math.min(N, Math.floor(p)), f = p - i;
      if (i !== ora) { if (ora >= 0 && opz.scatto) opz.scatto(i); ora = i; }
      for (var d = -1; d <= 1; d++) {   // la voce dopo sta sopra e scende al centro
        var idx = i + d, c = ((idx % 3) + 3) % 3;
        if (mostra[c] !== idx) { mostra[c] = idx; celle[c].textContent = seq[Math.max(0, Math.min(N + 1, idx))]; }
        celle[c].style.transform = "translate3d(0," + ((f - d) * H).toFixed(1) + "px,0)";
      }
    }
    posa(0);
    return { el: fin, via: function () {
      return new Promise(function (ok) {
        var t0 = performance.now(), finito = false;
        function fine() { if (finito) return; finito = true; posa(N); ok(); }
        (function giro() {
          if (finito) return;
          var u = Math.min(1, (performance.now() - t0) / opz.durata);
          posa(N * (1 - Math.pow(1 - u, 2.2)));   // frena come una ruota vera: veloce all'inizio, piano piano alla fine
          if (u >= 1) fine(); else requestAnimationFrame(giro);
        })();
        setTimeout(fine, opz.durata + 150);   // si ferma comunque sulla voce giusta
      });
    } };
  }

  window.SGStudio = {
    crea: creaStudio, camera: camera, inquadra: inquadra, suSchermo: suSchermo, largo: largo, suLeggio: suLeggio, suPubblico: suPubblico, panFila: panFila,
    terzo: terzo, viaTerzo: viaTerzo, barra: barra, viaBarra: viaBarra, aspettaTasto: aspettaTasto, lampo: lampo,
    accendi: accendi, accendiSolo: accendiSolo, faccia: faccia, tutteNormali: tutteNormali, puntiLeggio: puntiLeggio,
    cartello: cartello, cartelliGiu: cartelliGiu, pubblico: pubblico, logoSchermo: logoSchermo, fermaTimer: fermaTimer,
    apertura: apertura, stacco: stacco, finale: finale,
    testoLeggio: testoLeggio, tocca: tocca, fuori: fuori, scossa: scossa, sopraTesta: sopraTesta,
    avatarDi: avatarDi, mioAvatar: mioAvatar, avatarValido: avatarValido, coriandoli: coriandoli,
    raggi: raggi, rullo: rullo, faccina: telaFaccia, fineApertura: viaPalco,
    dorme: dorme, vuota: vuota, durataApertura: durataApertura, STACCO: STACCO, FX: FX, COLORI: ST_COL, piatto: true
  };
})();
