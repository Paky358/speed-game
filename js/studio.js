/* =========================================================
   STUDIO DEL GAME SHOW — condiviso dai giochi "Quiz e parole"
   (La linea del tempo, La Patata Bollente, …).
   Un "mondo" grande (studio luminoso, pubblico di mini avatar,
   maxischermo, leggii dei concorrenti) e una telecamera che lo
   inquadra con transform. Ogni gioco ci mette il suo contenuto
   sul maxischermo (S.sch) e fa la sua regia con questi pezzi.
   Regola d'oro per non far laggare: lo sfondo fermo è disegnato
   una volta su canvas; le animazioni muovono solo transform/opacity.
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

  // ---- la musichetta chill sotto allo studio: accordi morbidi, basso e batteria leggera, suonati al momento (niente file da scaricare) ----
  var Musica = (function () {
    var KEY = "sg_musica_studio", voglio = true, va = false, timer = null, bus = null, duck = null, master = null, rum = null;
    var prossimo = 0, passo = 0, vuoto = 0, colpi = [], VOL = 0.42;
    try { voglio = localStorage.getItem(KEY) !== "0"; } catch (e) {}
    var BPM = 84, SEDI = 60 / BPM / 4;   // la durata di un sedicesimo
    var ACC = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];   // Fa maj7 → Mi m7 → Re m7 → Do maj7
    var BAS = [41, 40, 38, 36];
    var MEL = [[[0, 76], [3, 72], [6, 69], [10, 72]], [[0, 74], [3, 71], [6, 67], [10, 71]], [[0, 72], [3, 69], [6, 65], [10, 69]], [[0, 71], [3, 67], [6, 64], [10, 67], [14, 72]]];
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function ep(c, t, m, dur, vol) {   // piano elettrico morbido
      var o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain(), lp = c.createBiquadFilter();
      o1.type = "sine"; o1.frequency.value = hz(m); o2.type = "triangle"; o2.frequency.value = hz(m) * 2.002; g2.gain.value = 0.16;
      lp.type = "lowpass"; lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(bus);
      o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }
    function pad(c, t, note, dur, vol) {   // tappeto caldo: due voci appena stonate per nota
      note.forEach(function (m) {
        [-5, 5].forEach(function (det) {
          var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
          o.type = "sawtooth"; o.frequency.value = hz(m); o.detune.value = det;
          lp.type = "lowpass"; lp.frequency.value = 650;
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.6); g.gain.setValueAtTime(vol, t + dur - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
          o.connect(lp); lp.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.35);
        });
      });
    }
    function basso(c, t, m, dur, vol) {
      var o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain(), lp = c.createBiquadFilter();
      o.type = "sine"; o.frequency.value = hz(m); o2.type = "triangle"; o2.frequency.value = hz(m); g2.gain.value = 0.35;
      lp.type = "lowpass"; lp.frequency.value = 420;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(bus);
      o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }
    function cassa(c, t, vol) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.3);
      if (vol > 0.3) colpi.push(t);   // le luci LED ballano a tempo
    }
    function rumoreBreve(c, t, tipo, freq, dur, vol) {   // rullante (passabanda) e charleston (passaalto)
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = rum; f.type = tipo; f.frequency.value = freq; if (tipo === "bandpass") f.Q.value = 0.7;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random() * 0.2); s.stop(t + dur + 0.02);
    }
    function campana(c, t, m, vol) {
      var o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
      o.type = "sine"; o.frequency.value = hz(m); o2.type = "sine"; o2.frequency.value = hz(m) * 3.01; g2.gain.value = 0.12;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus); o.start(t); o2.start(t); o.stop(t + 1.15); o2.stop(t + 1.15);
    }
    function suonaPasso(c, p, t) {
      var bar = Math.floor(p / 16) % 4, st = p % 16, giro = Math.floor(p / 64), acc = ACC[bar], r = BAS[bar];
      if (st === 0) pad(c, t, acc, SEDI * 16, 0.011);
      if (st === 0) acc.forEach(function (m) { ep(c, t, m, 1.3, 0.045); });
      if (st === 6 || st === 10) acc.forEach(function (m) { ep(c, t, m, 0.35, 0.028); });
      if (st === 0) basso(c, t, r, 0.8, 0.22);
      if (st === 7) basso(c, t, r + 12, 0.2, 0.1);
      if (st === 10) basso(c, t, r + 7, 0.4, 0.15);
      if (st === 0) cassa(c, t, 0.5); if (st === 10) cassa(c, t, 0.34); if (st === 7 && bar === 3) cassa(c, t, 0.22);
      if (st === 4 || st === 12) rumoreBreve(c, t, "bandpass", 1700, 0.16, 0.08);
      if (st % 2 === 0) rumoreBreve(c, t, "highpass", 7000, 0.045, st % 4 === 2 ? 0.032 : 0.022);
      if (giro % 2 === 1) MEL[bar].forEach(function (n) { if (n[0] === st) campana(c, t, n[1], 0.04); });
    }
    function programma() {
      var c = AC; if (!c || !va) return;
      if (!document.querySelector(".st-vista")) { if (++vuoto > 16) ferma(); return; }   // non c'è più lo studio: la musica sfuma
      vuoto = 0;
      if (document.hidden || c.state !== "running") { prossimo = c.currentTime + 0.1; return; }   // app in pausa: non accumulo note
      if (prossimo < c.currentTime - 0.2) prossimo = c.currentTime + 0.05;
      while (prossimo < c.currentTime + 0.35) {
        var sw = (passo % 4 === 2) ? SEDI * 0.3 : 0;   // un po' di swing
        try { suonaPasso(c, passo, prossimo + sw); } catch (e) {}
        prossimo += SEDI; passo++;
      }
    }
    function avvia() {
      if (!voglio || va) return;
      var c = ctx(); if (!c) return;
      try {
        va = true; colpi = []; vuoto = 0;
        var n = Math.floor(c.sampleRate * 0.4); rum = c.createBuffer(1, n, c.sampleRate); var d = rum.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        bus = c.createGain(); var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5200;
        duck = c.createGain(); master = c.createGain();
        master.gain.setValueAtTime(0.0001, c.currentTime); master.gain.linearRampToValueAtTime(VOL, c.currentTime + 2.5);
        bus.connect(lp); lp.connect(duck); duck.connect(master); master.connect(c.destination);
        prossimo = c.currentTime + 0.15; passo = 0;
        timer = setInterval(programma, 90);
      } catch (e) { va = false; }
    }
    function ferma(subito) {
      if (!va) return;
      va = false; clearInterval(timer); timer = null;
      var c = AC, m = master; master = null;
      if (c && m) {
        try { m.gain.cancelScheduledValues(c.currentTime); m.gain.setValueAtTime(m.gain.value, c.currentTime); m.gain.linearRampToValueAtTime(0.0001, c.currentTime + (subito ? 0.15 : 1.2)); } catch (e) {}
        setTimeout(function () { try { m.disconnect(); } catch (e) {} }, 1500);
      }
    }
    function attiva(on) { voglio = !!on; try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {} if (on) avvia(); else ferma(true); }
    // quando applaudono o c'è il rullo di tamburi la musica si abbassa un momento
    function abbassa(sec) {
      var c = AC; if (!va || !c || !duck) return;
      try {
        var t = c.currentTime; duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(duck.gain.value, t);
        duck.gain.linearRampToValueAtTime(0.35, t + 0.15); duck.gain.setValueAtTime(0.35, t + sec); duck.gain.linearRampToValueAtTime(1, t + sec + 0.8);
      } catch (e) {}
    }
    // 0..1: quanto è fresco l'ultimo colpo di cassa (per far ballare le luci LED a tempo); senza musica batte un tempo finto
    function battito() {
      var c = AC;
      if (va && c) { var now = c.currentTime; while (colpi.length > 1 && colpi[1] <= now) colpi.shift(); var t = colpi[0]; return (t != null && t <= now) ? Math.exp(-(now - t) * 7) : 0; }
      var b = performance.now() / 1000 * BPM / 60 / 2; return Math.exp(-(b - Math.floor(b)) * 120 / BPM * 7);
    }
    return { avvia: avvia, ferma: ferma, attiva: attiva, accesa: function () { return voglio; }, abbassa: abbassa, battito: battito };
  })();

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
    esploso: { occhi: "chiusi", sopracc: "preoccupate", bocca: "o" } };
  // l'avatar di un giocatore: quello che ha mandato (online), il mio profilo se è il mio nome, sennò uno fisso dal nome
  function avatarDi(g, faccia) {
    if (!window.SGOmino || !g) return "";
    var cfg = avatarValido(g.omino);
    if (!cfg) { var p = window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo(); cfg = (p && p.omino && p.nome === g.nome) ? p.omino : SGOmino.casuale(g.nome || "?"); }
    if (faccia && FACCE[faccia]) { var c2 = {}, n; for (n in cfg) c2[n] = cfg[n]; for (n in FACCE[faccia]) c2[n] = FACCE[faccia][n]; cfg = c2; }
    var k = JSON.stringify(cfg);
    if (!cacheAv[k]) { try { cacheAv[k] = SGOmino.svg(cfg, { busto: true }); } catch (e) { cacheAv[k] = ""; } }
    return cacheAv[k];
  }

  function coriandoli() {
    assicuraStileStudio();
    var c = document.createElement("div"); c.className = "st-coriandoli";
    var col = ["#ffd43b", "#37d47e", "#4dabf7", "#ff6b6b", "#cc5de8", "#fff"];
    for (var i = 0; i < 40; i++) {
      var p = document.createElement("i");
      p.style.left = (Math.random() * 100) + "%";
      p.style.background = col[i % col.length];
      p.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
      p.style.setProperty("--r", (Math.random() * 720 - 360) + "deg");
      p.style.animationDelay = (Math.random() * 0.4) + "s";
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 3200);
  }

  var STACCO = 2600;   // ms di stacco su chi gioca prima che parta il suo tempo (online l'host lo aggiunge al timer)
  function durataApertura(n) { return 7500 + (n <= 4 ? 1550 * n : 6800); }
  var ST_COL = ["#ffd43b", "#4dabf7", "#ff6b6b", "#51cf66", "#cc5de8", "#ff922b", "#20c997", "#f783ac", "#a9e34b", "#74c0fc"];
  function dorme(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function vuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }

  // Telefoni meno potenti: niente fari che girano e immagini dello studio più leggere
  var LEGGERO = !!((navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 3));

  function assicuraStileStudio() {
    if (document.getElementById("sg-studio-css")) return;
    var st = document.createElement("style"); st.id = "sg-studio-css";
    // Regola d'oro per non far laggare: le animazioni muovono SOLO transform e opacity su pezzi piccoli.
    // Tutto quello che sta fermo (sfondo, arco, pubblico, pavimento, cornice) è disegnato una volta sola su canvas.
    st.textContent = [
      ".schermata.st-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#07041a;animation:none}",
      ".schermata.st-piena>.testa,.schermata.st-piena>.piede{display:none}",
      ".schermata.st-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".st-vista{position:relative;width:100%;max-width:520px;margin:0 auto;height:var(--alt,100dvh);overflow:hidden;background:#07041a;user-select:none;-webkit-user-select:none}",
      ".st-mondo{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}",
      ".st-mondo>*{position:absolute}",
      ".st-quieto .st-anim,.st-quieto .st-anim *{animation-play-state:paused!important}",
      ".st-quieto .st-leggio .luce,.st-quieto .st-leggio .pozza{opacity:0!important}",
      ".st-tela{left:0;top:0}",
      // fari che girano (solo rotazione)
      ".st-fascio{transform-origin:50% 0;opacity:.5;will-change:transform;animation:stFascio 6s ease-in-out infinite alternate}",
      "@keyframes stFascio{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}",
      // torri LED: un pannello a led (canvas) che si ridisegna pochi fotogrammi al secondo, a tempo di musica
      ".st-eq{pointer-events:none}",
      // lampadine della cornice: due disegni che si alternano (solo opacità)
      ".st-lampade{will-change:opacity;animation:stLampade .9s linear infinite}",
      "@keyframes stLampade{0%,49%{opacity:1}51%,100%{opacity:0}}",
      // pubblico (canvas) che salta quando applaude, con lucine dei telefoni e flash
      ".st-pubwrap{left:0}",
      ".st-pubwrap>*,.st-pubdeco>*{position:absolute}",
      ".st-pubdeco{left:0;top:0;width:100%;height:100%;pointer-events:none}",
      // il pubblico è fatto a file (canvas): ogni fila ondeggia per conto suo, quando applaude saltano
      ".st-fila{left:0;will-change:transform;animation:stOnda var(--dur,2s) ease-in-out var(--rit,0s) infinite}",
      "@keyframes stOnda{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}",
      ".st-pubwrap.salta .st-fila{animation:stSaltaFila .24s ease-in-out var(--rit,0s) infinite alternate}",
      "@keyframes stSaltaFila{from{transform:translateY(0)}to{transform:translateY(-7px)}}",
      // bastoncini luminosi e cartelli che sventolano, occhi di bue colorati che passano sulla folla
      ".st-bastone{width:5px;height:22px;margin:-22px 0 0 -2.5px;border-radius:3px;background:linear-gradient(#fff,var(--c) 30%);box-shadow:0 0 8px 2px var(--c);transform-origin:50% 100%;will-change:transform;animation:stSventola var(--dur,1.4s) ease-in-out var(--rit,0s) infinite alternate}",
      ".st-cartellone{margin:-34px 0 0 -22px;width:44px;transform-origin:50% 100%;will-change:transform;animation:stSventolaPoco var(--dur,1.8s) ease-in-out var(--rit,0s) infinite alternate}",
      ".st-cartellone b{display:block;background:#fff;color:#2a1d6e;border-radius:4px;font:900 9px/1.1 system-ui,sans-serif;text-align:center;padding:4px 2px;box-shadow:0 2px 6px rgba(0,0,0,.4)}",
      ".st-cartellone:after{content:'';display:block;width:3px;height:12px;margin:0 auto;background:#c9a46a}",
      "@keyframes stSventola{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}",
      "@keyframes stSventolaPoco{from{transform:rotate(-9deg) translateY(0)}to{transform:rotate(9deg) translateY(-4px)}}",
      ".st-occhio{opacity:.5;will-change:transform;animation:stGiro var(--dur,8s) ease-in-out var(--rit,0s) infinite}",
      "@keyframes stGiro{0%,100%{transform:translate(0,0)}33%{transform:translate(var(--dx),var(--dy))}66%{transform:translate(calc(var(--dx) * .35),calc(var(--dy) * -.7))}}",
      ".st-ringhiera{height:5px;border-radius:3px;background:linear-gradient(90deg,transparent,#ffd43b,transparent);box-shadow:0 0 10px rgba(255,212,59,.6)}",
      ".st-lucina{width:6px;height:6px;margin:-3px;border-radius:50%;background:#e8fbff;box-shadow:0 0 8px 3px rgba(160,240,255,.8);will-change:opacity;animation:stLuccica 2.4s ease-in-out infinite}",
      "@keyframes stLuccica{0%,100%{opacity:.15}50%{opacity:1}}",
      ".st-flash{width:26px;height:26px;margin:-13px;border-radius:50%;background:radial-gradient(circle,#fff 0 30%,rgba(255,255,255,0) 70%);opacity:0}",
      ".st-flash.on{animation:stFlash .5s ease-out}",
      "@keyframes stFlash{0%{opacity:0;transform:scale(.4)}15%{opacity:1;transform:scale(2.4)}100%{opacity:0;transform:scale(1)}}",
      ".st-fumetto{font-weight:900;font-size:36px;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.4);opacity:0;white-space:nowrap;transform:translate(-50%,0);pointer-events:none;z-index:5}",
      ".st-fumetto.on{animation:stFum 1.8s ease-out}",
      "@keyframes stFum{0%{opacity:0;transform:translate(-50%,20px) scale(.6)}15%{opacity:1;transform:translate(-50%,0) scale(1.1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-30px)}}",
      // maxischermo
      ".st-schermo{border-radius:14px;overflow:hidden;box-shadow:0 0 0 5px #120a38;background:radial-gradient(130% 55% at 50% 0%,#2d44a8 0%,#18225a 50%,#0b1030 100%)}",
      ".st-sch-in{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(8px + env(safe-area-inset-top)) 12px 10px}",
      ".st-vista.con-barra .st-sch-in{padding-bottom:104px}",
      ".st-sch-in .tl-hud{flex:0 0 auto;margin-left:42px;margin-right:42px;align-items:center}",
      ".st-sch-in .tl-scroll{-webkit-mask:none;mask:none}",
      ".st-sch-in .tl-ev .card{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(255,255,255,.1)}",
      ".st-vetro{position:absolute;inset:0;pointer-events:none;background:linear-gradient(118deg,rgba(255,255,255,.1),transparent 32%)}",
      ".st-idle{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px}",
      ".st-idle .logo{font-size:46px;font-weight:900;line-height:1.03;letter-spacing:.03em;color:#ffd43b;text-shadow:0 4px 0 #a85c00,0 0 22px rgba(255,160,40,.55)}",
      ".st-idle .stelle{color:#ffe066;letter-spacing:.35em;font-size:24px}",
      ".st-idle .sotto{font-size:14px;font-weight:800;letter-spacing:.32em;text-transform:uppercase;color:#cdd6ff}",
      ".st-sch-in .tl-esito{justify-content:center;padding-bottom:40px}",
      ".st-sch-in .tl-flip{width:min(310px,88%);height:230px}",
      ".st-raggi{position:absolute;left:50%;top:38%;width:180%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;opacity:0;will-change:transform;animation:stRaggi 14s linear infinite,stAppari .6s ease 1.3s forwards}",
      "@keyframes stRaggi{to{transform:translate(-50%,-50%) rotate(360deg)}}",
      "@keyframes stAppari{to{opacity:1}}",
      // leggii (le postazioni)
      ".st-leggio{display:flex;flex-direction:column;align-items:center}",
      ".st-leggio .alone{position:absolute;left:50%;top:0;width:96%;aspect-ratio:1;transform:translateX(-50%);opacity:.45;transition:opacity .4s,transform .4s;pointer-events:none}",
      // occhio di bue: il fascio scende fino al pavimento e ci lascia una pozza di luce, e illumina il banco (tutto già disegnato: si accende con l'opacità)
      ".st-leggio .luce{position:absolute;left:50%;bottom:-17%;width:172%;height:480%;transform:translateX(-50%);opacity:0;transition:opacity .45s;pointer-events:none}",
      ".st-leggio .pozza{position:absolute;z-index:1;left:50%;bottom:-24%;width:180%;height:30%;transform:translateX(-50%);opacity:0;transition:opacity .45s;pointer-events:none}",
      ".st-leggio.acceso .pozza{opacity:1}",
      ".st-leggio .av{position:relative;z-index:2;width:74%;aspect-ratio:178/182}",
      ".st-leggio .av canvas{width:100%;height:100%;display:block}",
      // il bancone è un'immagine (canvas): niente da ridisegnare quando la telecamera si muove, e non può sparire
      ".st-leggio .podio{position:relative;z-index:3;width:100%;height:6.82em;margin-top:-.9em}",
      ".st-leggio .banco,.st-leggio .banco-luce{position:absolute;left:0;top:-1.1em;width:100%;height:calc(100% + 2.2em);pointer-events:none}",
      ".st-leggio .banco-luce{opacity:0;transition:opacity .45s}",
      ".st-leggio.acceso .banco-luce{opacity:1}",
      ".st-leggio .bagliore{position:absolute;left:-.85%;top:5.73em;width:101.7%;height:1.76em;opacity:0;pointer-events:none}",
      ".st-leggio.acceso .bagliore{animation:stLed .6s ease-in-out infinite alternate}",
      ".st-leggio .piano{position:absolute;left:0;top:0;width:100%;height:1.1em}",
      ".st-leggio.acceso .alone{opacity:1;transform:translateX(-50%) scale(1.12)}",
      ".st-leggio.acceso .luce{opacity:1}",
      "@keyframes stLed{from{opacity:.2}to{opacity:.95}}",
      ".st-leggio .cart{position:absolute;z-index:4;left:50%;top:-44%;width:48%;aspect-ratio:1;opacity:0;transform:translateX(-50%) translateY(40%) scale(.2);transition:transform .35s cubic-bezier(.3,1.5,.5,1),opacity .2s}",
      ".st-leggio .cart:after{content:'';position:absolute;left:50%;top:96%;width:.5em;height:2.2em;margin-left:-.25em;background:linear-gradient(90deg,#b58a4e,#e6c28a,#b58a4e);border-radius:.2em;z-index:-1}",
      ".st-leggio .cart.su{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}",
      ".st-leggio .cart .in{position:absolute;inset:0}",
      ".st-leggio .cart.gira .in{animation:stGiraCart .6s ease-in-out}",
      "@keyframes stGiraCart{0%,100%{transform:none}50%{transform:scaleX(.04)}}",
      ".st-leggio .cart .f{position:absolute;inset:0;border-radius:.9em;display:flex;align-items:center;justify-content:center;",
        "font-size:3.4em;font-weight:900;background:linear-gradient(#ffffff,#e8e4ff);color:#2a1d6e;box-shadow:0 .25em .5em rgba(0,0,0,.4)}",
      ".st-leggio .cart .f.r,.st-leggio .cart.gira .f{visibility:hidden}",
      ".st-leggio .cart.gira .f{animation:stFronte .6s linear}",
      ".st-leggio .cart.gira .f.r{visibility:visible;animation:stRetro .6s linear}",
      "@keyframes stFronte{0%,49%{visibility:visible}50%,100%{visibility:hidden}}",
      "@keyframes stRetro{0%,49%{visibility:hidden}50%,100%{visibility:visible}}",
      ".st-leggio .cart .f.r.si{background:linear-gradient(#6ff0a6,#27b567)} .st-leggio .cart .f.r.no{background:linear-gradient(#ff95a0,#e0364a)}",
      ".st-leggio .delta{position:absolute;z-index:5;left:50%;top:6%;transform:translateX(-50%);font-weight:900;font-size:2.6em;opacity:0;white-space:nowrap;text-shadow:0 .08em 0 rgba(0,0,0,.45)}",
      ".st-leggio .delta.on{animation:stDelta 1.7s ease-out}",
      "@keyframes stDelta{0%{opacity:0;transform:translate(-50%,20%) scale(.6)}15%{opacity:1;transform:translate(-50%,-20%) scale(1.15)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-120%)}}",
      // sovrimpressioni sopra la telecamera
      ".st-esci{position:absolute;left:8px;top:calc(8px + env(safe-area-inset-top));z-index:25;width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.4);color:#fff;font:inherit;font-size:1.25rem;font-weight:900;cursor:pointer}",
      ".st-musica{position:absolute;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:25;width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.4);color:#fff;font:inherit;font-size:1.05rem;cursor:pointer}",
      ".st-rec{position:absolute;right:52px;top:calc(12px + env(safe-area-inset-top));z-index:25;font-size:11px;font-weight:900;letter-spacing:.1em;color:#fff;background:rgba(0,0,0,.45);border-radius:99px;padding:3px 10px;opacity:0;transition:opacity .3s}",
      ".st-rec.on{opacity:1}",
      ".st-rec:before{content:'';display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff3b3b;margin-right:6px;animation:stRec 1s steps(2) infinite}",
      "@keyframes stRec{50%{opacity:.2}}",
      ".st-terzo{position:absolute;left:12px;bottom:calc(104px + env(safe-area-inset-bottom));z-index:22;display:flex;align-items:center;gap:10px;max-width:calc(100% - 24px);padding:6px 16px 6px 6px;",
        "border-radius:16px;border-left:7px solid var(--col,#ff3ea5);background:linear-gradient(100deg,#fff3b0,#ffca3a 55%,#f59f00);color:#241f00;box-shadow:0 8px 20px rgba(0,0,0,.45);",
        "transform:translateX(-120%);transition:transform .45s cubic-bezier(.3,1.3,.5,1)}",
      ".st-terzo.on{transform:none}",
      ".st-terzo .fac{width:46px;height:46px;border-radius:50%;overflow:hidden;background:rgba(0,0,0,.15);flex:0 0 auto}",
      ".st-terzo .fac svg{width:100%;height:100%;display:block}",
      ".st-terzo .ic{font-size:28px;flex:0 0 auto}",
      ".st-terzo .tx{font-weight:900;font-size:18px;line-height:1.15;min-width:0}",
      ".st-terzo .tx small{display:block;font-size:12px;font-weight:700;opacity:.8}",
      ".st-barra{position:absolute;left:0;right:0;bottom:0;z-index:22;display:flex;flex-direction:column;gap:8px;padding:12px 14px calc(14px + env(safe-area-inset-bottom));",
        "background:linear-gradient(rgba(7,4,26,0),rgba(7,4,26,.92) 36%);transform:translateY(110%);transition:transform .35s}",
      ".st-barra.on{transform:none}",
      ".st-barra .btn{min-height:58px;font-size:1.1rem}",
      ".st-lampo{position:absolute;inset:0;z-index:24;background:#fff;opacity:0;pointer-events:none}",
      ".st-lampo.on{animation:stLampo .45s ease-out}",
      "@keyframes stLampo{0%{opacity:.85}100%{opacity:0}}",
      // se il telefono fatica mentre la telecamera si muove, si spengono le luci che ballano (prima di tutto la fluidità)
      ".st-leggero-auto .st-fascio,.st-leggero-auto .st-occhio,.st-leggero-auto .st-bastone,.st-leggero-auto .st-lucina{display:none}",
      ".st-leggero .st-fascio,.st-leggero .st-lucina,.st-leggero .st-lampade,.st-leggero .st-fila,.st-leggero .st-bastone,.st-leggero .st-cartellone,.st-leggero .st-occhio{animation:none}",
      // coriandoli, scossa della telecamera
      ".st-coriandoli{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden}",
      ".st-coriandoli i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;will-change:transform;animation:stCade 2.6s cubic-bezier(.2,.6,.4,1) forwards}",
      "@keyframes stCade{to{transform:translate(var(--dx),110vh) rotate(var(--r))}}",
      ".st-scena{position:absolute;inset:0;will-change:transform}",
      // rullo della slot machine (lettera, categoria a sorpresa): tre caselle che scorrono, ombra sopra e sotto come un cilindro
      ".st-rullo{position:relative;overflow:hidden}",
      ".st-cella{position:absolute;left:0;top:0;width:100%;display:flex;align-items:center;justify-content:center;text-align:center;will-change:transform}",
      ".st-rullo:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(0,0,0,.34),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 70%,rgba(0,0,0,.34))}",
      // leggii toccabili (es. a chi passare la bomba) ed eliminati
      ".st-leggio .anello{position:absolute;z-index:1;left:50%;top:-4%;width:90%;aspect-ratio:1;margin-left:-45%;border-radius:50%;border:.28em solid #6ff0a6;opacity:0;pointer-events:none}",
      ".st-leggio.tocca{cursor:pointer;touch-action:none}",
      // la zona da toccare: testa, corpo e banco col nome (anche la parte del banco che sporge sotto)
      ".st-leggio .tap{position:absolute;z-index:9;left:-5%;right:-5%;top:-14%;bottom:-18%;display:none;-webkit-tap-highlight-color:transparent}",
      ".st-leggio.tocca .tap{display:block}",
      ".st-leggio.tocca .anello{opacity:1;will-change:transform,opacity;animation:stAnello 1s ease-in-out infinite}",
      "@keyframes stAnello{0%,100%{transform:scale(.92);opacity:.55}50%{transform:scale(1.06);opacity:1}}",
      ".st-leggio.fuori .alone{opacity:0}",
      "@media (prefers-reduced-motion:reduce){.st-fascio,.st-lucina,.st-lampade,.st-fila,.st-bastone,.st-cartellone,.st-occhio{animation:none}}"
    ].join("");
    document.head.appendChild(st);
  }

  // Crea lo studio (una sola volta per partita) e lo mette a schermo.
  // giocatori: [{ nome, omino? }]; opz: { io (indice di chi ha questo telefono, -1 = nessuno), esci() }
  function creaStudio(t, giocatori, opz) {
    assicuraStileStudio();
    var el = t.el, s = t.schermata({});
    s.classList.add("st-piena");
    var vista = el("div", { class: "st-vista" + (LEGGERO ? " st-leggero" : "") }), scena = el("div", { class: "st-scena" }), mondo = el("div", { class: "st-mondo" });
    scena.appendChild(mondo); vista.appendChild(scena);   // la scena serve per far tremare l'inquadratura (scossa) senza toccare la telecamera
    vista.addEventListener("scroll", function () { vista.scrollTop = 0; vista.scrollLeft = 0; });
    var S = { t: t, s: s, vista: vista, scena: scena, mondo: mondo, gioc: [], io: -1, L: [], shot: null, timer: null,
      titolo: opz.titolo || "", logo: opz.logo || [opz.titolo || "GAME SHOW"], onTocca: null };
    function pezzo(tag, cls, dove) { var e = el(tag, { class: cls }); (dove || mondo).appendChild(e); return e; }
    // --- studio: il fondo fermo è un'immagine sola (canvas), sopra solo pochi pezzi che si muovono ---
    S.tela = pezzo("canvas", "st-tela");
    // i fari che girano sono luci già disegnate (canvas): la scheda grafica le gira senza ridisegnarle, anche mentre la telecamera si muove
    S.fasci = [];
    if (!LEGGERO) ["rgba(255,236,170,.55)", "rgba(255,62,165,.5)", "rgba(34,211,238,.5)", "rgba(255,236,170,.55)"].forEach(function (c, i) {
      var f = pezzo("canvas", "st-fascio st-anim"); fascio(f, c);
      f.style.animationDelay = (-i * 1.9) + "s"; f.style.animationDuration = (5 + (i % 3)) + "s"; S.fasci.push(f);
    });
    S.eq = [0, 1].map(function () { return pezzo("canvas", "st-eq"); });   // torri LED: pannelli a led (canvas)
    // il pubblico: file di mini avatar (canvas, create in disegnaPubblico) + cose vive sopra
    S.pubWrap = pezzo("div", "st-pubwrap");
    S.strisce = [];
    S.pubDeco = pezzo("div", "st-pubdeco", S.pubWrap);
    S.ringhiere = []; for (var q = 0; q < 6; q++) S.ringhiere.push(pezzo("div", "st-ringhiera", S.pubDeco));
    S.occhi = LEGGERO ? [] : ["rgba(255,62,165,.55)", "rgba(34,211,238,.5)", "rgba(255,212,59,.42)"].map(function (c, i) {
      var o = pezzo("canvas", "st-occhio st-anim", S.pubDeco); chiazza(o, c);
      o.style.setProperty("--dur", (7 + i * 2) + "s"); o.style.setProperty("--rit", (-i * 2.3) + "s"); o._i = i; return o;
    });
    var COLB = ["#ff3ea5", "#22d3ee", "#ffd43b", "#a06bff", "#51cf66"];
    function vivo(e, zona) { e._rx = Math.random(); e._ry = Math.random(); e._zona = zona; e.style.setProperty("--dur", (1.1 + Math.random() * 0.9).toFixed(2) + "s"); e.style.setProperty("--rit", (-Math.random() * 2).toFixed(2) + "s"); return e; }
    S.bastoni = []; for (q = 0; q < (LEGGERO ? 0 : 14); q++) { var ba = vivo(pezzo("div", "st-bastone st-anim", S.pubDeco), q % 3); ba.style.setProperty("--c", COLB[q % COLB.length]); S.bastoni.push(ba); }
    S.cartelli = ["❤️ BRAVI", "⭐⭐⭐", "FORZA!", "👏👏", "WOW!"].map(function (tx, i) { var ca = vivo(pezzo("div", "st-cartellone st-anim", S.pubDeco), i % 3); ca.appendChild(el("b", { text: tx })); ca._ry *= 0.7; return ca; });
    S.lucine = []; for (q = 0; q < (LEGGERO ? 0 : 10); q++) { var lu = pezzo("div", "st-lucina st-anim", S.pubDeco); lu.style.animationDelay = (-Math.random() * 2.4) + "s"; lu._rx = Math.random(); lu._ry = Math.random(); lu._zona = q % 3; S.lucine.push(lu); }
    S.flash = []; for (q = 0; q < 6; q++) { var fl = pezzo("div", "st-flash", S.pubDeco); fl._rx = Math.random(); fl._ry = Math.random(); fl._zona = q % 3; S.flash.push(fl); }
    S.lampade = pezzo("canvas", "st-lampade st-anim");
    S.schermo = pezzo("div", "st-schermo");
    S.sch = el("div", { class: "st-sch-in" }); S.schermo.appendChild(S.sch); S.schermo.appendChild(el("div", { class: "st-vetro" }));
    S.fumetto = pezzo("div", "st-fumetto");
    S.zonaLeggii = el("div"); S.zonaLeggii.style.cssText = "position:absolute;left:0;top:0;width:0;height:0"; mondo.appendChild(S.zonaLeggii);
    // --- sovrimpressioni ---
    vista.appendChild(el("button", { class: "st-esci", text: "‹", "aria-label": "Esci", onclick: function () { if (window.confirm("Uscire dalla partita?")) { fermaTimer(S); opz.esci(); } } }));
    // la musichetta di sottofondo si accende e si spegne da qui (e il telefono se lo ricorda)
    var bMus = el("button", { class: "st-musica", "aria-label": "Musica", text: Musica.accesa() ? "🎵" : "🔇", onclick: function () { var on = !Musica.accesa(); Musica.attiva(on); bMus.textContent = on ? "🎵" : "🔇"; } });
    vista.appendChild(bMus);
    // il primo tocco sblocca l'audio del telefono (serve a chi entra da un link, senza aver toccato niente)
    vista.addEventListener("pointerdown", function () { ctx(); Musica.avvia(); }, { passive: true });
    S.rec = el("div", { class: "st-rec", text: "IN ONDA" }); vista.appendChild(S.rec);
    S.terzoEl = el("div", { class: "st-terzo" }); vista.appendChild(S.terzoEl);
    S.barraEl = el("div", { class: "st-barra" }); vista.appendChild(S.barraEl);
    S.lampoEl = el("div", { class: "st-lampo" }); vista.appendChild(S.lampoEl);
    s._contenuto.appendChild(vista);
    t.mostra(s);
    S.vivo = function () { return vista.isConnected; };
    // (facoltativi, per i giochi che vogliono uno studio diverso) opz.posti(S) = dove stanno i leggii; opz.dopoLayout(S) = dopo ogni sistemazione
    S.postiFn = opz.posti || null; S.dopoLayout = opz.dopoLayout || null;
    S.impostaGiocatori = function (lista, io) { S.gioc = lista.map(function (g) { return { nome: g.nome, omino: g.omino || null, col: g.col || null }; }); S.io = io == null ? -1 : io; costruisciLeggii(S); layoutStudio(S); };
    S.impostaGiocatori(giocatori, opz.io);
    // appena le facce del pubblico sono pronte ridisegno la folla (all'inizio per un attimo ci sono le sagome)
    // la sigla aspetta le facce del pubblico: così la folla non si ridisegna mentre la telecamera si muove
    S.pubPronto = new Promise(function (ok) {
      preparaPoolPubblico(function () { if (S.vivo() && S.zonePub) disegnaPubblico(S); ok(); });
      setTimeout(ok, 1500);
    });
    logoSchermo(S);
    // Prima di tutto la telecamera sta un attimo sul maxischermo a grandezza vera: il telefono prepara lo studio
    // alla risoluzione piena una volta sola, e poi (con la telecamera mossa a mano) non lo ridisegna più a ogni zoom.
    S.shot = function () { return S.R.schermo; };
    metti(S, vistaDi(S, S.R.schermo), true);
    S.rasterOk = false;
    S.attesaRaster = new Promise(function (ok) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(ok, 30); }); });
      setTimeout(ok, 250);
    }).then(function () { S.rasterOk = true; });
    preparaSuoni();
    Musica.avvia();
    avviaEq(S);
    // se cambia la misura dello schermo ridisegno lo studio (una volta, dopo che si è assestato)
    var toR = null;
    function suResize() {
      if (!S.vivo()) { window.removeEventListener("resize", suResize); return; }
      clearTimeout(toR);
      toR = setTimeout(function () { if (!S.vivo()) return;
        var ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;   // è la tastiera che si apre: non ridisegno lo studio
        if (Math.abs(S.vista.clientWidth - S.VW) < 2 && Math.abs(S.vista.clientHeight - S.VH) < 2) return; layoutStudio(S); camera(S, S.shot(), 0); }, 200);
    }
    window.addEventListener("resize", suResize);
    return S;
  }

  // ---- avatar dei leggii come immagini già pronte (non si ridisegnano a ogni zoom della telecamera) ----
  var cacheImg = {};
  function immagineAvatar(g, f, cb) {
    var svg = avatarDi(g, f); if (!svg) return;
    var e = cacheImg[svg];
    if (!e) {
      e = cacheImg[svg] = { img: new Image(), ok: false, cbs: [] };
      e.img.onload = function () { e.ok = true; var l = e.cbs; e.cbs = []; l.forEach(function (c) { c(e.img); }); };
      e.img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", "<svg width='356' height='364' "));
    }
    if (!cb) return;   // solo da preparare per dopo
    if (e.ok) cb(e.img); else e.cbs.push(cb);
  }
  function mettiAvatar(X, g, f) {
    var v = X.versione = (X.versione || 0) + 1;
    immagineAvatar(g, f, function (img) {
      if (X.versione !== v) return;   // nel frattempo è cambiata faccia
      var c = X.avc, x = c.getContext("2d"), w = c.width, h = c.height; x.clearRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
      if (X.grigio) {   // eliminato: in bianco e nero e più scuro, disegnato qui una volta (un filtro peserebbe a ogni fotogramma)
        x.save(); x.globalCompositeOperation = "saturation"; x.fillStyle = "#808080"; x.fillRect(0, 0, w, h);
        x.globalCompositeOperation = "destination-in"; x.drawImage(img, 0, 0, w, h);
        x.globalCompositeOperation = "source-atop"; x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(0, 0, w, h); x.restore();
      }
    });
  }
  function costruisciLeggii(S) {
    var el = S.t.el; vuota(S.zonaLeggii); S.L = [];
    S.gioc.forEach(function (g, i) {
      var col = g.col || ST_COL[i % ST_COL.length], L = el("div", { class: "st-leggio" }); L.style.position = "absolute"; L.style.setProperty("--col", col);   // g.col: il colore scelto dal gioco (es. quello della squadra)
      // tutto quello che si illumina è già disegnato (canvas): accendere un leggio cambia solo l'opacità
      L.innerHTML = "<canvas class='luce' width='96' height='268'></canvas><canvas class='pozza'></canvas><canvas class='alone'></canvas>" +
        "<div class='anello'></div><div class='cart'><div class='in'><div class='f'>?</div><div class='f r'></div></div></div><div class='delta'></div><div class='av'><canvas width='356' height='364'></canvas></div>" +
        "<div class='podio'><canvas class='banco'></canvas><canvas class='banco-luce'></canvas><canvas class='bagliore'></canvas><div class='piano'></div></div>";
      cono(L.querySelector(".luce")); pozza(L.querySelector(".pozza")); chiazza(L.querySelector(".alone"), rgbaDi(col, 1)); bagliore(L.querySelector(".bagliore"), col);
      // toccare un concorrente (es. per passargli la bomba). Il gioco decide chi si può toccare.
      // Vale tutta la sagoma, banco col nome compreso (.tap), e basta un tocco anche se il dito si muove un po':
      // su iPhone il "click" a volte non arriva (il tocco viene preso per uno scorrimento).
      L.appendChild(el("div", { class: "tap" }));
      (function (L, i) {
        var giu = null, ultimo = 0;
        function scegli() { if (S.onTocca && L.classList.contains("tocca") && Date.now() - ultimo > 450) { ultimo = Date.now(); S.onTocca(i); } }
        L.addEventListener("pointerdown", function (e) { giu = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
        L.addEventListener("pointerup", function (e) { if (giu && giu.id === e.pointerId && Math.abs(e.clientX - giu.x) + Math.abs(e.clientY - giu.y) < 28) scegli(); giu = null; });
        L.addEventListener("pointercancel", function () { giu = null; });
        L.addEventListener("click", scegli);   // mouse e tastiera (se il tocco è già passato, il doppione si scarta)
      })(L, i);
      var X = { el: L, avc: L.querySelector(".av canvas"), cart: L.querySelector(".cart"), delta: L.querySelector(".delta"),
        banco: L.querySelector(".banco"), bancoLuce: L.querySelector(".banco-luce"), nome: g.nome, col: col, tu: i === S.io,
        disp: { t: "0", neg: false, testo: false }, valore: 0, faccia: null };
      mettiAvatar(X, g, null);
      setTimeout(function () { ["esulta", "triste", "pensa"].forEach(function (f) { immagineAvatar(g, f, null); }); }, 1500 + i * 200);   // pronte per dopo (non tutte insieme all'entrata)
      S.L.push(X);
    });
  }
  function rgbaDi(hex, a) { var n = parseInt(String(hex).slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  function pozza(c) {   // la pozza di luce sul pavimento (un'ellisse morbida)
    c.width = 240; c.height = 40;
    var x = c.getContext("2d"); x.translate(120, 20); x.scale(1, 40 / 240);
    var g = x.createRadialGradient(0, 0, 0, 0, 0, 120);
    g.addColorStop(0, "rgba(255,248,215,.85)"); g.addColorStop(0.5, "rgba(255,232,160,.4)"); g.addColorStop(1, "rgba(255,232,160,0)");
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 120, 0, 7); x.fill();
  }
  function bagliore(c, col) {   // il bagliore della striscia led sotto al bancone quando il leggio è acceso
    c.width = 150; c.height = 40;
    var x = c.getContext("2d"); x.translate(75, 20); x.scale(1, 40 / 150);
    var g = x.createRadialGradient(0, 0, 0, 0, 0, 75);
    g.addColorStop(0, rgbaDi(col, 1)); g.addColorStop(1, rgbaDi(col, 0));
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 75, 0, 7); x.fill();
  }

  // ---- il bancone del concorrente, disegnato su canvas (misure in "em": 1em = un decimo della larghezza del leggio) ----
  // Da y = 0 (il piano) in giù: piano 1.1em, frontale 5.3em con lampadine, nome e display, striscia led .42em.
  var FONT_PAGINA = null;
  function fontPagina() { if (!FONT_PAGINA) { try { FONT_PAGINA = getComputedStyle(document.body).fontFamily || "system-ui,sans-serif"; } catch (e) { FONT_PAGINA = "system-ui,sans-serif"; } } return FONT_PAGINA; }
  function rettTondo(x, X, Y, w, h, rs, ri) {   // rettangolo con angoli sopra (rs) e sotto (ri) diversi
    x.beginPath(); x.moveTo(X + rs, Y); x.lineTo(X + w - rs, Y); x.quadraticCurveTo(X + w, Y, X + w, Y + rs); x.lineTo(X + w, Y + h - ri);
    x.quadraticCurveTo(X + w, Y + h, X + w - ri, Y + h); x.lineTo(X + ri, Y + h); x.quadraticCurveTo(X, Y + h, X, Y + h - ri); x.lineTo(X, Y + rs); x.quadraticCurveTo(X, Y, X + rs, Y); x.closePath();
  }
  function trapezio(x, w, em) {   // il frontale: stretto in basso
    var x0 = 0.05 * w, x1 = 0.95 * w, y0 = 1.1 * em, y1 = 6.4 * em, r = 0.05 * (x1 - x0);
    x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y0); x.lineTo(x1 - r, y1); x.lineTo(x0 + r, y1); x.closePath();
  }
  function misuraBanco(X) {   // dimensioni del canvas in pixel veri (nitido anche negli zoom della telecamera)
    var w = X.w || 100, em = w * 0.1, H = (6.82 + 2.2) * em, q = Math.min(LEGGERO ? 1.6 : 3, (window.devicePixelRatio || 1) * 1.3);
    return { w: w, em: em, H: H, q: q, cw: Math.max(1, Math.round(w * q)), ch: Math.max(1, Math.round(H * q)), su: 1.1 * em };
  }
  function fondoBanco(X) {   // tutto quello che non cambia: piano, pulsante, frontale, lampadine, nome, striscia led
    var M = misuraBanco(X), c = X.fondo || (X.fondo = document.createElement("canvas")), w = M.w, em = M.em, q = M.q;
    c.width = M.cw; c.height = M.ch;
    var x = c.getContext("2d"); x.setTransform(q, 0, 0, q, 0, M.su * q);
    // piano
    x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowOffsetY = 0.25 * em * q; x.shadowBlur = 0.45 * em * q;
    var g = x.createLinearGradient(0, 0, 0, 1.1 * em); g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, "#d8d2ff"); g.addColorStop(0.75, "#8d84d8"); g.addColorStop(1, "#5a50a8");
    x.fillStyle = g; rettTondo(x, 0, 0, w, 1.1 * em, 0.55 * em, 0.2 * em); x.fill(); x.restore();
    // pulsante rosso
    var bw = 1.15 * em, bh = 0.62 * em, bx = w * 0.87 - bw, by = -0.5 * em;
    g = x.createRadialGradient(bx + bw * 0.4, by + bh * 0.3, 0, bx + bw * 0.4, by + bh * 0.3, bw * 0.75);
    g.addColorStop(0, "#ffc2c7"); g.addColorStop(0.55, "#ff2d45"); g.addColorStop(1, "#8a0f1c");
    x.fillStyle = g; rettTondo(x, bx, by, bw, bh, bh * 0.95, 0.2 * em); x.fill();
    // "TU" sul leggio di chi ha questo telefono
    if (X.tu) {
      var f = 0.72 * em; x.font = "900 " + f.toFixed(2) + "px " + fontPagina();
      var tw = x.measureText("TU").width + 1.1 * f, th = f * 1.25, tx = w * 0.1, ty = -0.62 * em;
      g = x.createLinearGradient(0, ty, 0, ty + th); g.addColorStop(0, "#fff3a8"); g.addColorStop(1, "#ffca3a");
      x.fillStyle = g; rettTondo(x, tx, ty, tw, th, th / 2, th / 2); x.fill();
      x.fillStyle = "#241f00"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("TU", tx + tw / 2, ty + th / 2 + f * 0.04);
    }
    // frontale
    trapezio(x, w, em);
    g = x.createLinearGradient(0, 1.1 * em, 0, 6.4 * em); g.addColorStop(0, "#36268a"); g.addColorStop(0.55, "#1b1152"); g.addColorStop(1, "#0d0730");
    x.fillStyle = g; x.fill();
    g = x.createLinearGradient(0.05 * w, 0, 0.95 * w, 0); g.addColorStop(0, "rgba(255,255,255,.14)"); g.addColorStop(0.22, "rgba(255,255,255,0)"); g.addColorStop(0.78, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,.1)");
    x.fillStyle = g; x.fill();
    // lampadine in fila
    var fx0 = 0.05 * w + 0.08 * 0.9 * w, fx1 = 0.95 * w - 0.08 * 0.9 * w, passo = 0.62 * em, cy = 1.1 * em + 0.39 * em;
    for (var lx = fx0 + passo / 2; lx < fx1; lx += passo) {
      g = x.createRadialGradient(lx, cy, 0, lx, cy, 0.21 * em);
      g.addColorStop(0, "#fffbe0"); g.addColorStop(0.43, "#fffbe0"); g.addColorStop(0.7, X.col); g.addColorStop(1, rgbaDi(X.col, 0));
      x.fillStyle = g; x.fillRect(lx - 0.21 * em, cy - 0.21 * em, 0.42 * em, 0.42 * em);
    }
    // nome
    var fn = 1.3 * em, nome = String(X.nome || ""); x.font = "900 " + fn.toFixed(2) + "px " + fontPagina();
    var maxW = 0.9 * w - 0.8 * em;
    if (x.measureText(nome).width > maxW) { while (nome.length > 1 && x.measureText(nome + "…").width > maxW) nome = nome.slice(0, -1); nome += "…"; }
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = "rgba(0,0,0,.45)"; x.fillText(nome, w / 2, 1.1 * em + 1.55 * em + 0.08 * em);
    x.fillStyle = "#fff"; x.fillText(nome, w / 2, 1.1 * em + 1.55 * em);
    // striscia led colorata
    x.save(); x.shadowColor = X.col; x.shadowBlur = 0.8 * em * q; x.fillStyle = X.col;
    rettTondo(x, 0.09 * w, 6.4 * em, 0.82 * w, 0.42 * em, 0.01, 0.3 * em); x.fill(); x.restore();
    X.fondoW = w;
    // la luce sul frontale quando il leggio è acceso (canvas a parte: si accende con l'opacità)
    var cl = X.bancoLuce; if (cl) {
      cl.width = M.cw; cl.height = M.ch; var y = cl.getContext("2d"); y.setTransform(q, 0, 0, q, 0, M.su * q);
      trapezio(y, w, em); g = y.createLinearGradient(0, 1.1 * em, 0, 6.4 * em); g.addColorStop(0, "rgba(255,246,205,.3)"); g.addColorStop(1, "rgba(255,246,205,.08)");
      y.fillStyle = g; y.fill();
    }
  }
  // il display del leggio (punti o una scritta) sopra al fondo; se il concorrente è eliminato tutto in bianco e nero
  function disegnaBanco(X) {
    if (!X || !X.banco) return;
    if (!X.fondo || X.fondoW !== X.w) fondoBanco(X);
    var M = misuraBanco(X), c = X.banco, w = M.w, em = M.em, q = M.q;
    if (c.width !== M.cw || c.height !== M.ch) { c.width = M.cw; c.height = M.ch; }
    var dest = X.grigio ? (X.tmp || (X.tmp = document.createElement("canvas"))) : c;
    if (dest !== c) { dest.width = M.cw; dest.height = M.ch; }
    var x = dest.getContext("2d");
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, M.cw, M.ch); x.drawImage(X.fondo, 0, 0);
    x.setTransform(q, 0, 0, q, 0, M.su * q);
    var d = X.disp || { t: "" }, dy = 1.1 * em + 2.61 * em, dh = 1.95 * em;
    var f = (d.testo ? 1.2 : 1.6) * em, font = d.testo ? "900 " + f.toFixed(2) + "px " + fontPagina() : "900 " + f.toFixed(2) + "px 'Courier New',ui-monospace,monospace";
    x.font = font;
    var tw = x.measureText(d.t).width, dw = Math.min(0.86 * w, Math.max(0.72 * 0.9 * w, tw + 0.9 * em)), dx = (w - dw) / 2;
    x.fillStyle = "#05030f"; rettTondo(x, dx, dy, dw, dh, 0.3 * em, 0.3 * em); x.fill();
    x.strokeStyle = "rgba(255,224,102,.3)"; x.lineWidth = 0.08 * em; rettTondo(x, dx + 0.04 * em, dy + 0.04 * em, dw - 0.08 * em, dh - 0.08 * em, 0.26 * em, 0.26 * em); x.stroke();
    x.fillStyle = d.neg ? "#ff8d98" : "#ffe066"; x.textAlign = "center"; x.textBaseline = "middle";
    if (tw > dw - 0.4 * em) { x.save(); x.translate(w / 2, dy + dh / 2); x.scale((dw - 0.4 * em) / tw, 1); x.fillText(d.t, 0, f * 0.04); x.restore(); }
    else x.fillText(d.t, w / 2, dy + dh / 2 + f * 0.04);
    if (dest !== c) {   // eliminato: grigio e più scuro
      var y = c.getContext("2d"); y.setTransform(1, 0, 0, 1, 0, 0); y.clearRect(0, 0, M.cw, M.ch); y.drawImage(dest, 0, 0);
      y.globalCompositeOperation = "saturation"; y.fillStyle = "#808080"; y.fillRect(0, 0, M.cw, M.ch);
      y.globalCompositeOperation = "destination-in"; y.drawImage(dest, 0, 0);
      y.globalCompositeOperation = "source-atop"; y.fillStyle = "rgba(0,0,0,.45)"; y.fillRect(0, 0, M.cw, M.ch);
      y.globalCompositeOperation = "source-over";
    }
  }
  // posti dei leggii: fino a 4 una fila; da 5 a 10 due file sfalsate (quella dietro più piccola e più in alto)
  function postiLeggii(S) {
    var n = S.gioc.length, VW = S.VW, VH = S.VH, out = [], i;
    if (n <= 4) {
      var sp = 1.92 * VW / Math.max(1, n), w = Math.min(0.46 * VW, sp * 0.92);
      for (i = 0; i < n; i++) out.push({ cx: 0.04 * VW + sp * (i + 0.5), top: 1.36 * VH, w: w, fila: 0 });
      return out;
    }
    // file sfalsate di mezzo posto: con B == F serve mezzo posto in più di spazio
    var F = Math.ceil(n / 2), B = n - F, pari = B === F, spf = 1.92 * VW / (F + (pari ? 0.5 : 0)), wf = Math.min(0.40 * VW, spf * 0.88), wb = wf * 0.84;
    for (i = 0; i < F; i++) out.push({ cx: 0.04 * VW + spf * (i + 0.5) + (pari ? spf / 2 : 0), top: 1.5 * VH, w: wf, fila: 0 });
    for (i = 0; i < B; i++) out.push({ cx: 0.04 * VW + spf * (pari ? i + 0.5 : i + 1), top: 1.27 * VH, w: wb, fila: 1 });
    return out;
  }

  // ---- disegno dello studio su canvas (una volta sola) ----
  function qualitaTela(S) { return Math.min(LEGGERO ? 1 : 2, window.devicePixelRatio || 1, 4000 / S.H); }
  function preparaTela(c, w, h, q) {
    c.width = Math.max(1, Math.round(w * q)); c.height = Math.max(1, Math.round(h * q));
    c.style.width = w + "px"; c.style.height = h + "px";
    var x = c.getContext("2d"); x.setTransform(q, 0, 0, q, 0, 0); return x;
  }
  // ---- luci morbide disegnate una volta (canvas piccoli): la scheda grafica le ingrandisce e le muove senza ridisegnarle ----
  function trasp(col) { return col.replace(/,\s*[\d.]+\)$/, ",0)"); }   // lo stesso colore, trasparente
  function fascio(c, col) {   // fascio di un faro: stretto in alto, largo in basso, sfuma verso il fondo
    c.width = 64; c.height = 380;
    var x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 380);
    g.addColorStop(0, col); g.addColorStop(0.88, trasp(col)); g.addColorStop(1, trasp(col));
    x.fillStyle = g; x.beginPath(); x.moveTo(29.4, 0); x.lineTo(34.6, 0); x.lineTo(64, 380); x.lineTo(0, 380); x.closePath(); x.fill();
  }
  function chiazza(c, col) {   // macchia di luce rotonda (occhi di bue colorati sulla folla)
    c.width = c.height = 132;
    var x = c.getContext("2d"), g = x.createRadialGradient(66, 66, 0, 66, 66, 66);
    g.addColorStop(0, col); g.addColorStop(1, trasp(col));
    x.fillStyle = g; x.fillRect(0, 0, 132, 132);
  }
  function cono(c) {   // occhio di bue sul leggio: scende dall'alto fino al pavimento
    if (!c || !c.getContext) return;
    var w = c.width, h = c.height, x = c.getContext("2d"), g = x.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, "rgba(255,246,205,.46)"); g.addColorStop(0.4, "rgba(255,246,205,.2)"); g.addColorStop(0.92, "rgba(255,246,205,0)"); g.addColorStop(1, "rgba(255,246,205,0)");
    x.fillStyle = g; x.beginPath(); x.moveTo(w * 0.43, 0); x.lineTo(w * 0.57, 0); x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill();
  }
  // ---- torri LED: due pannelli a led che ballano a tempo di musica (un canvas ciascuno, ridisegnato 14 volte al secondo) ----
  var COL_LED = (function () {   // dal basso (viola) all'alto (giallo chiaro)
    var t = [[123, 44, 255], [255, 62, 165], [255, 179, 0], [255, 243, 168]], out = [];
    for (var s = 0; s < 12; s++) {
      var p = s / 11 * 3, k = Math.min(2, Math.floor(p)), f = p - k, a = t[k], b = t[k + 1];
      out.push("rgb(" + Math.round(a[0] + (b[0] - a[0]) * f) + "," + Math.round(a[1] + (b[1] - a[1]) * f) + "," + Math.round(a[2] + (b[2] - a[2]) * f) + ")");
    }
    return out;
  })();
  function disegnaTorreEq(c, liv) {
    if (!c || !c.getContext || c.width < 2) return;
    var x = c.getContext("2d"), W = c.width, H = c.height, N = 7, SEG = 12, bw = W / N, sh = H / SEG;
    x.clearRect(0, 0, W, H);
    for (var b = 0; b < N; b++) {
      var acc = Math.round((liv ? liv[b] : 0.3 + ((b * 37) % 60) / 100) * SEG);
      for (var s = 0; s < SEG; s++) {
        x.globalAlpha = s < acc ? 1 : 0.13; x.fillStyle = COL_LED[s];
        x.fillRect(b * bw + bw * 0.15, H - (s + 1) * sh + sh * 0.15, bw * 0.7, sh * 0.7);
      }
    }
    x.globalAlpha = 1;
  }
  function disegnaEq(S) { (S.eq || []).forEach(function (c, k) { disegnaTorreEq(c, S.eqLiv ? S.eqLiv.slice(k * 7, k * 7 + 7) : null); }); }
  function avviaEq(S) {
    if (LEGGERO) return disegnaEq(S);   // telefoni leggeri: pannelli fermi
    var obi = []; S.eqLiv = []; for (var b = 0; b < 14; b++) { S.eqLiv.push(Math.random() * 0.6); obi.push(Math.random()); }
    var id = setInterval(function () {
      if (!S.vivo()) { clearInterval(id); return; }
      if (document.hidden || S.leggeroAuto || S.mondo.classList.contains("st-quieto")) return;   // non si vede (o il telefono fatica): fermo
      var batt = Musica.battito();
      for (var b = 0; b < 14; b++) {
        if (Math.random() < 0.3) obi[b] = 0.12 + Math.random() * 0.7;
        var tgt = Math.min(1, obi[b] + batt * ((b % 7) < 3 ? 0.55 : 0.3)), l = S.eqLiv[b];   // le barre dei bassi saltano di più sul colpo
        S.eqLiv[b] = l + (tgt - l) * (tgt > l ? 0.75 : 0.3);   // sale di scatto, scende piano
      }
      disegnaEq(S);
    }, 70);
  }
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
  function rett(x, X, Y, w, h, r) {
    x.beginPath(); x.moveTo(X + r, Y); x.lineTo(X + w - r, Y); x.quadraticCurveTo(X + w, Y, X + w, Y + r); x.lineTo(X + w, Y + h - r);
    x.quadraticCurveTo(X + w, Y + h, X + w - r, Y + h); x.lineTo(X + r, Y + h); x.quadraticCurveTo(X, Y + h, X, Y + h - r); x.lineTo(X, Y + r); x.quadraticCurveTo(X, Y, X + r, Y); x.closePath();
  }
  function alone(x, cx, cy, r, col) { var g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  function lampadina(x, px, py, accesa) {
    if (accesa) { alone(x, px, py, 8, "rgba(255,190,60,.55)"); x.fillStyle = "#ffc93c"; x.beginPath(); x.arc(px, py, 3.6, 0, 7); x.fill(); x.fillStyle = "#fffbe0"; x.beginPath(); x.arc(px, py, 2.4, 0, 7); x.fill(); }
    else { x.fillStyle = "#5e4108"; x.beginPath(); x.arc(px, py, 3.6, 0, 7); x.fill(); x.fillStyle = "#8a6716"; x.beginPath(); x.arc(px, py, 2.2, 0, 7); x.fill(); }
  }
  function puntiCornice(R) {   // le lampadine lungo il bordo del maxischermo, ogni 20px
    var p = [], x0 = R.x - 8, y0 = R.y - 8, x1 = R.x + R.w + 8, y1 = R.y + R.h + 8, d;
    for (d = x0 + 10; d < x1 - 5; d += 20) p.push([d, y0]);
    for (d = y0 + 10; d < y1 - 5; d += 20) p.push([x1, d]);
    for (d = x1 - 10; d > x0 + 5; d -= 20) p.push([d, y1]);
    for (d = y1 - 10; d > y0 + 5; d -= 20) p.push([x0, d]);
    return p;
  }
  function disegnaStudio(S) {
    var VW = S.VW, VH = S.VH, W = S.W, H = S.H, R = S.R.schermo, q = qualitaTela(S), i;
    var x = preparaTela(S.tela, W, H, q);
    // fondo luminoso da prima serata
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#3a1b8c"); g.addColorStop(0.4, "#27106a"); g.addColorStop(0.7, "#1a0b4d"); g.addColorStop(1, "#120736");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    alone(x, W * 0.5, H * 0.24, VW * 0.9, "rgba(255,206,110,.5)");
    alone(x, W * 0.03, H * 0.3, VW * 0.85, "rgba(255,62,165,.55)");
    alone(x, W * 0.97, H * 0.3, VW * 0.85, "rgba(34,211,238,.5)");
    alone(x, W * 0.5, H * 0.68, VW * 1.1, "rgba(140,90,255,.4)");
    x.fillStyle = "rgba(255,255,255,.05)"; for (i = 0; i < W; i += 64) x.fillRect(i, 0, 2, H);
    x.fillStyle = "rgba(255,255,255,.035)"; for (i = 0; i < H; i += 64) x.fillRect(0, i, W, 2);
    // fari fissi dipinti (sui telefoni leggeri al posto di quelli che girano)
    if (LEGGERO) [0.1, 0.37, 0.63, 0.9].forEach(function (p, k) {
      x.save(); x.translate(W * p, 0.03 * VH); x.rotate((k % 2 ? 1 : -1) * 0.25);
      var fg = x.createLinearGradient(0, 0, 0, 1.3 * VH); fg.addColorStop(0, "rgba(255,236,170,.35)"); fg.addColorStop(1, "rgba(255,236,170,0)");
      x.fillStyle = fg; x.beginPath(); x.moveTo(-0.02 * VW, 0); x.lineTo(0.02 * VW, 0); x.lineTo(0.22 * VW, 1.3 * VH); x.lineTo(-0.22 * VW, 1.3 * VH); x.closePath(); x.fill(); x.restore();
    });
    // arco al neon attorno al maxischermo
    var ax = R.x - 0.13 * VW, aw = R.w + 0.26 * VW, ay = 0.012 * VH, ah = 1.12 * VH, ry = Math.min(aw * 0.3, 0.16 * VH);
    x.beginPath(); x.moveTo(ax, ay + ah); x.lineTo(ax, ay + ry); x.ellipse(ax + aw / 2, ay + ry, aw / 2, ry, 0, Math.PI, 2 * Math.PI); x.lineTo(ax + aw, ay + ah);
    x.fillStyle = "rgba(10,6,40,.45)"; x.fill();
    var ag = x.createLinearGradient(ax, ay, ax + aw, ay + ah);
    ag.addColorStop(0, "#ff3ea5"); ag.addColorStop(0.35, "#ffd43b"); ag.addColorStop(0.65, "#22d3ee"); ag.addColorStop(1, "#a06bff");
    x.save(); x.lineWidth = 7; x.strokeStyle = ag; x.shadowColor = "rgba(255,62,165,.9)"; x.shadowBlur = 26; x.stroke(); x.restore();
    x.lineWidth = 2; x.strokeStyle = "rgba(255,255,255,.75)"; x.stroke();
    // torri LED (le barre che ballano sono sopra, a parte)
    S.torriR = [[0.06 * VW, 0.1 * VH, 0.36 * VW, 0.36 * VH], [1.58 * VW, 0.1 * VH, 0.36 * VW, 0.36 * VH]];
    S.torriR.forEach(function (p) {
      x.save(); rett(x, p[0], p[1], p[2], p[3], 14); x.fillStyle = "#0a0624"; x.shadowColor = "rgba(255,62,165,.65)"; x.shadowBlur = 26; x.fill(); x.restore();
      rett(x, p[0], p[1], p[2], p[3], 14); x.lineWidth = 3; x.strokeStyle = "#2b2366"; x.stroke();
      x.save(); x.fillStyle = "#ffe066"; x.font = "900 20px system-ui,sans-serif"; x.textAlign = "center"; x.shadowColor = "#ff9d2e"; x.shadowBlur = 12;
      x.fillText("★  ★  ★", p[0] + p[2] / 2, p[1] + 30); x.restore();
    });
    // gradinate del pubblico: fondo scuro a gradoni (le persone sono sopra, a file che si muovono)
    (S.zonePub || []).forEach(function (z) {
      var zy = S.pubTop + z[1];
      x.save(); x.beginPath(); rettAlto(x, z[0], zy, z[2], z[3], 18); x.clip();
      var zg = x.createLinearGradient(0, zy, 0, zy + z[3]); zg.addColorStop(0, "#0c0729"); zg.addColorStop(1, "#1d1352");
      x.fillStyle = zg; x.fillRect(z[0], zy, z[2], z[3]);
      x.fillStyle = "rgba(255,255,255,.05)"; for (var gy2 = zy + 22; gy2 < zy + z[3]; gy2 += 24) x.fillRect(z[0], gy2, z[2], 3);
      x.restore();
    });
    // traliccio con i fari in alto
    var th = 0.035 * VH, tg = x.createLinearGradient(0, 0, 0, th); tg.addColorStop(0, "#3b3560"); tg.addColorStop(1, "#1d1838");
    x.fillStyle = tg; x.fillRect(0, 0, W, th);
    x.strokeStyle = "rgba(255,255,255,.18)"; x.lineWidth = 2; x.beginPath();
    for (i = -th; i < W + th; i += 12) { x.moveTo(i, th * 0.18); x.lineTo(i + th * 0.5, th * 0.82); x.moveTo(i + th * 0.5, th * 0.18); x.lineTo(i, th * 0.82); }
    x.stroke();
    for (i = 0; i < 6; i++) {
      var fx = W * (0.07 + i * 0.172), fy = 0.02 * VH + 12;
      alone(x, fx, fy, 44, "rgba(255,220,130,.6)");
      var lg = x.createRadialGradient(fx - 2, fy - 3, 1, fx, fy, 12); lg.addColorStop(0, "#fff"); lg.addColorStop(0.35, "#ffe9a8"); lg.addColorStop(0.7, "#ffb300"); lg.addColorStop(1, "#5a3a00");
      x.fillStyle = lg; x.beginPath(); x.arc(fx, fy, 12, 0, 7); x.fill();
    }
    // pavimento lucido con la striscia di luci
    var py = 1.48 * VH, pg = x.createLinearGradient(0, py, 0, H); pg.addColorStop(0, "#2c1c78"); pg.addColorStop(0.5, "#170d4a"); pg.addColorStop(1, "#0c0628");
    x.fillStyle = pg; x.fillRect(0, py, W, H - py);
    x.save(); x.beginPath(); x.rect(0, py, W, H - py); x.clip(); alone(x, W / 2, py, VW * 0.9, "rgba(255,206,110,.28)"); x.restore();
    x.fillStyle = "rgba(255,255,255,.07)"; for (i = 0; i < W; i += 70) x.fillRect(i, py, 2, H - py);
    var sg = x.createLinearGradient(0, 0, W, 0);
    ["#ff3ea5", "#ffd43b", "#22d3ee", "#a06bff", "#ff3ea5"].forEach(function (c, k) { sg.addColorStop(k / 4, c); });
    x.save(); x.fillStyle = sg; x.shadowColor = "#ffd43b"; x.shadowBlur = 20; x.fillRect(0, py, W, 6); x.restore();
    // maxischermo: alone azzurro dietro, cornice dorata con le lampadine
    x.save(); rett(x, R.x, R.y, R.w, R.h, 14); x.fillStyle = "#0b1030"; x.shadowColor = "rgba(120,170,255,.6)"; x.shadowBlur = 40; x.fill(); x.restore();
    x.save(); rett(x, R.x - 16, R.y - 16, R.w + 32, R.h + 32, 26); x.fillStyle = "#2a1d00"; x.shadowColor = "rgba(255,190,60,.6)"; x.shadowBlur = 34; x.fill(); x.restore();
    rett(x, R.x - 16, R.y - 16, R.w + 32, R.h + 32, 26); x.lineWidth = 3; x.strokeStyle = "#3a2a00"; x.stroke();
    var pc = puntiCornice(R);
    pc.forEach(function (p, k) { lampadina(x, p[0], p[1], k % 2 === 1); });
    // seconda serie di lampadine (quelle che si alternano): canvas sopra che si accende e spegne
    var lx = R.x - 16, ly = R.y - 16, y2 = preparaTela(S.lampade, R.w + 32, R.h + 32, q);
    S.lampade.style.left = lx + "px"; S.lampade.style.top = ly + "px";
    pc.forEach(function (p, k) { lampadina(y2, p[0] - lx, p[1] - ly, k % 2 === 0); });
  }
  // il pubblico: silhouette disegnate una volta sola (poi il canvas intero "salta" quando applaude)
  // ---- il pubblico: tanti piccoli avatar veri, disegnati una volta a file (canvas) che ondeggiano ognuna per conto suo ----
  var poolPubblico = null;   // una ventina di facce pronte (bitmap), riusate per tutta la folla
  function preparaPoolPubblico(cb) {
    if (poolPubblico) { if (poolPubblico.pronti) cb(); else poolPubblico.cbs.push(cb); return; }
    poolPubblico = { pronti: false, img: [], cbs: [cb] };
    var N = 20, fatti = 0;
    function uno() {
      if (++fatti < N) return;
      poolPubblico.pronti = true; var l = poolPubblico.cbs; poolPubblico.cbs = [];
      l.forEach(function (f) { try { f(); } catch (e) {} });
    }
    if (!window.SGOmino) { fatti = N - 1; uno(); return; }
    for (var i = 0; i < N; i++) (function (i) {
      var svg; try { svg = SGOmino.svg(SGOmino.casuale("pubblico-" + i), { busto: true }); } catch (e) { uno(); return; }
      var img = new Image();
      img.onload = function () {
        try { var c = document.createElement("canvas"); c.width = 72; c.height = 74; c.getContext("2d").drawImage(img, 0, 0, 72, 74); poolPubblico.img.push(c); } catch (e) {}
        uno();
      };
      img.onerror = uno;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", "<svg width='72' height='74' "));
    })(i);
  }
  // rettangolo con solo gli angoli in alto arrotondati (aggiunto al percorso in corso)
  function rettAlto(x, X, Y, w, h, r) {
    x.moveTo(X, Y + h); x.lineTo(X, Y + r); x.quadraticCurveTo(X, Y, X + r, Y); x.lineTo(X + w - r, Y);
    x.quadraticCurveTo(X + w, Y, X + w, Y + r); x.lineTo(X + w, Y + h); x.closePath();
  }
  function sagoma(x, cx, y, s) {   // persona stilizzata (finché le facce non sono pronte)
    x.fillStyle = "#3a2d78"; x.beginPath(); x.ellipse(cx, y + s * 0.92, s * 0.46, s * 0.34, 0, 0, 7); x.fill();
    x.fillStyle = "#6f5cb8"; x.beginPath(); x.arc(cx, y + s * 0.38, s * 0.26, 0, 7); x.fill();
  }
  function disegnaPubblico(S) {
    var W = S.W, h = S.pubH, q = Math.min(1.5, qualitaTela(S)), Z = S.zonePub;
    S.pubWrap.style.top = S.pubTop + "px"; S.pubWrap.style.width = W + "px"; S.pubWrap.style.height = h + "px";
    S.strisce.forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
    S.strisce = [];
    var pool = (poolPubblico && poolPubblico.pronti && poolPubblico.img.length) ? poolPubblico.img : null;
    var seme = 11; function rnd() { seme = (seme * 16807) % 2147483647; return seme / 2147483647; }
    // le file: in alto (in fondo alla sala) più piccole, in basso (davanti) più grandi
    var righe = [], y = 2;
    while (y < h - 8) { var sz = 24 + 14 * (y / h); righe.push({ y: y, s: sz }); y += sz * 0.58; }
    var PER = 4;
    for (var r0 = 0; r0 < righe.length; r0 += PER) {
      var gruppo = righe.slice(r0, r0 + PER), ult = gruppo[gruppo.length - 1];
      var y0 = Math.max(0, Math.floor(gruppo[0].y - 3)), y1 = Math.min(h, Math.ceil(ult.y + ult.s * 1.08));
      if (y1 - y0 < 4) continue;
      var c = document.createElement("canvas"); c.className = "st-fila st-anim";
      var x = preparaTela(c, W, y1 - y0, q);
      c.style.top = y0 + "px";
      c.style.setProperty("--dur", (1.6 + rnd() * 1.3).toFixed(2) + "s");
      c.style.setProperty("--rit", (-rnd() * 2).toFixed(2) + "s");
      x.translate(0, -y0);
      x.save(); x.beginPath(); Z.forEach(function (z) { rettAlto(x, z[0], z[1], z[2], z[3], 18); }); x.clip();
      gruppo.forEach(function (R, k) {
        var s = R.s, passo = s * 0.78, off = ((r0 + k) % 2) * passo / 2;
        Z.forEach(function (z, zi) {
          if (R.y < z[1] - s * 0.2 || R.y > z[1] + z[3] - s * 0.35) return;
          for (var px = z[0] - passo * 0.4 + off; px < z[0] + z[2] - s * 0.3; px += passo) {
            // nella fascia sotto il maxischermo salto i tratti dove ci sono già le gradinate laterali
            if (zi === 2 && ((px + s > Z[0][0] && px < Z[0][0] + Z[0][2]) || (px + s > Z[1][0] && px < Z[1][0] + Z[1][2]))) continue;
            var ss = s * (0.9 + rnd() * 0.2), jx = (rnd() - 0.5) * s * 0.2, jy = (rnd() - 0.5) * s * 0.14;
            if (pool) {
              var im = pool[Math.floor(rnd() * pool.length)];
              if (rnd() < 0.5) x.drawImage(im, px + jx, R.y + jy, ss, ss * 1.03);
              else { x.save(); x.translate(px + jx + ss, R.y + jy); x.scale(-1, 1); x.drawImage(im, 0, 0, ss, ss * 1.03); x.restore(); }
            } else sagoma(x, px + jx + ss / 2, R.y + jy, ss);
          }
        });
      });
      // luce da palco solo sulle persone: più buio in fondo (in alto), magenta a sinistra e azzurro a destra
      x.globalCompositeOperation = "source-atop";
      var sg = x.createLinearGradient(0, 0, 0, h); sg.addColorStop(0, "rgba(14,7,44,.72)"); sg.addColorStop(0.55, "rgba(14,7,44,.46)"); sg.addColorStop(1, "rgba(14,7,44,.34)");   // il pubblico sta in penombra: i concorrenti devono risaltare
      x.fillStyle = sg; x.fillRect(0, y0, W, y1 - y0);
      var hg = x.createLinearGradient(0, 0, W, 0);
      hg.addColorStop(0, "rgba(255,62,165,.3)"); hg.addColorStop(0.22, "rgba(255,62,165,0)"); hg.addColorStop(0.78, "rgba(34,211,238,0)"); hg.addColorStop(1, "rgba(34,211,238,.3)");
      x.fillStyle = hg; x.fillRect(0, y0, W, y1 - y0);
      x.globalCompositeOperation = "source-over";
      x.restore();
      S.pubWrap.insertBefore(c, S.pubDeco);
      S.strisce.push(c);
    }
  }
  function layoutStudio(S) {
    var VW = S.vista.clientWidth || 360, VH = S.vista.clientHeight || 640, W = 2 * VW, H = 2 * VH;
    S.VW = VW; S.VH = VH; S.W = W; S.H = H;
    function pos(e, x, y, w, h) { e.style.left = x + "px"; e.style.top = y + "px"; if (w != null) e.style.width = w + "px"; if (h != null) e.style.height = h + "px"; }
    S.mondo.style.width = W + "px"; S.mondo.style.height = H + "px";
    S.R = { schermo: { x: 0.5 * VW, y: 0.06 * VH, w: VW, h: VH } };
    var R = S.R.schermo;
    // zone del pubblico (coordinate dentro al blocco del pubblico): due gradinate ai lati e la fascia sotto il maxischermo
    S.pubTop = 0.52 * VH; S.pubH = 1.48 * VH - S.pubTop;
    var fondo = (R.y + R.h + 18) - S.pubTop;   // la fascia parte sotto la cornice, così le lampadine restano sopra
    S.zonePub = [[0.03 * VW, 0, 0.42 * VW, S.pubH], [1.55 * VW, 0, 0.42 * VW, S.pubH], [0.03 * VW, fondo, 1.94 * VW, S.pubH - fondo]];
    disegnaStudio(S);
    disegnaPubblico(S);
    pos(S.schermo, R.x, R.y, R.w, R.h);
    S.fasci.forEach(function (f, i) { var fx = W * (0.1 + i * 0.267); pos(f, fx - 0.22 * VW, 0.03 * VH, 0.44 * VW, 1.35 * VH); });
    S.eq.forEach(function (e, i) {   // dentro agli angoli tondi della torre
      var p = S.torriR[i], qe = LEGGERO ? 1 : 1.5; pos(e, p[0] + 6, p[1] + 44, p[2] - 12, p[3] - 50);
      e.width = Math.max(1, Math.round((p[2] - 12) * qe)); e.height = Math.max(1, Math.round((p[3] - 50) * qe));
    });
    disegnaEq(S);
    function inPub(e) { var z = S.zonePub[e._zona]; pos(e, z[0] + 12 + e._rx * (z[2] - 24), z[1] + 24 + e._ry * (z[3] - 60)); }
    S.lucine.forEach(inPub); S.flash.forEach(inPub);
    S.bastoni.forEach(inPub); S.cartelli.forEach(inPub);
    S.ringhiere.forEach(function (r, i) { var lato = i % 2, fila = Math.floor(i / 2); pos(r, lato ? 1.55 * VW : 0.03 * VW, (0.2 + fila * 0.26) * VH, 0.42 * VW, 5); });
    S.occhi.forEach(function (o, i) {   // occhi di bue colorati che passano sulla folla
      var z = S.zonePub[i], d = 0.55 * VW; pos(o, z[0] + z[2] / 2 - d / 2, z[1] + Math.min(z[3], 0.5 * VH) * 0.35 - d / 2, d, d);
      o.style.setProperty("--dx", (i === 2 ? 0.7 * VW : (i ? -0.25 : 0.25) * VW) + "px"); o.style.setProperty("--dy", (i === 2 ? -0.06 * VH : 0.42 * VH) + "px");
    });
    pos(S.fumetto, W / 2, 1.06 * VH);
    // leggii
    S.posti = S.postiFn ? S.postiFn(S) : postiLeggii(S);
    var ordine = S.posti.map(function (p, i) { return i; }).sort(function (a, b) { return S.posti[b].fila - S.posti[a].fila; });   // prima la fila dietro
    ordine.forEach(function (i) {
      var p = S.posti[i], X = S.L[i]; if (!X) return;
      pos(X.el, p.cx - p.w / 2, p.top, p.w);
      X.el.style.fontSize = (p.w * 0.1).toFixed(1) + "px";
      if (X.w !== p.w) { X.w = p.w; disegnaBanco(X); }   // il bancone si ridisegna solo se cambia misura
      S.zonaLeggii.appendChild(X.el);
    });
    S.file = S.posti.length > 4 ? 2 : 1;
    if (S.dopoLayout) try { S.dopoLayout(S); } catch (e) {}   // il gioco sistema i suoi pezzi (es. i banconi delle squadre)
  }

  // ---------- TELECAMERA ----------
  // La muovo io fotogramma per fotogramma (non con una transizione CSS). Con la transizione il telefono ridisegnava tutto lo
  // studio all'inizio e alla fine di ogni movimento: scatti, e a volte il bancone spariva per un attimo. Così invece lo studio,
  // disegnato una volta a grandezza piena, viene solo spostato e ingrandito dalla scheda grafica.
  function curva(x1, y1, x2, y2) {   // accelerazione morbida (come cubic-bezier del CSS)
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function X(t) { return ((ax * t + bx) * t + cx) * t; }
    function D(t) { return (3 * ax * t + 2 * bx) * t + cx; }
    return function (u) {
      if (u <= 0) return 0; if (u >= 1) return 1;
      var t = u, i, e, d;
      for (i = 0; i < 8; i++) { e = X(t) - u; if (Math.abs(e) < 1e-5) break; d = D(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
      if (!(t >= 0 && t <= 1) || Math.abs(X(t) - u) > 1e-3) { var a = 0, b = 1; t = u; for (i = 0; i < 30; i++) { e = X(t); if (Math.abs(e - u) < 1e-5) break; if (e < u) a = t; else b = t; t = (a + b) / 2; } }
      return ((ay * t + by) * t + cy) * t;
    };
  }
  var EASE = curva(0.45, 0.05, 0.25, 1);
  function vistaDi(S, r) {   // centro e ingrandimento di un'inquadratura, senza mai uscire dallo studio (niente fasce nere ai bordi)
    var s = Math.min(S.VW / r.w, S.VH / r.h), cx = r.x + r.w / 2, cy = r.y + r.h / 2, vw = S.VW / s, vh = S.VH / s;
    var su = (S.sopraLibero || 0) * S.VH;   // un gioco con qualcosa di fisso in alto (es. il tabellone della Ruota) può far salire la telecamera oltre il bordo
    if (vw <= S.W) cx = Math.max(vw / 2, Math.min(S.W - vw / 2, cx));
    if (vh <= S.H + su) cy = Math.max(vh / 2 - su, Math.min(S.H - vh / 2, cy));
    return { cx: cx, cy: cy, s: s };
  }
  function metti(S, v, fermo) {   // mette la telecamera su un punto dello studio (centro e ingrandimento)
    var s = v.s, tx = S.VW / 2 - v.cx * s, ty = S.VH / 2 - v.cy * s;
    if (fermo && Math.abs(s - 1) < 0.001) { s = 1; tx = Math.round(tx); ty = Math.round(ty); }   // ferma sul maxischermo: nitida al pixel
    S.mondo.style.transform = "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0) scale(" + s.toFixed(5) + ")";
    S.cam = { cx: v.cx, cy: v.cy, s: v.s };
  }
  function camera(S, r, ms) {
    if (!S.rasterOk && S.attesaRaster) return S.attesaRaster.then(function () { return camera(S, r, ms); });   // prima lo studio si prepara
    var dest = vistaDi(S, r), suSch = r === S.R.schermo, mossa = S.mossa = (S.mossa || 0) + 1;
    S.mondo.classList.toggle("st-quieto", suSch);   // sul maxischermo lo studio si ferma (risparmio batteria)
    S.rec.classList.toggle("on", !suSch);
    if (!ms || !S.cam) { metti(S, dest, true); return dorme(0); }
    var da = S.cam, t0 = performance.now(), l0 = Math.log(da.s), l1 = Math.log(dest.s);
    return new Promise(function (fine) {
      function passo(t) {
        if (S.mossa !== mossa) return;   // nel frattempo è partita un'altra inquadratura
        var u = Math.min(1, ((t || performance.now()) - t0) / ms), e = EASE(u);
        if (u >= 1) { metti(S, dest, true); return; }
        // il centro scorre dritto, lo zoom cambia in proporzione: il movimento sembra quello di una telecamera vera
        metti(S, { cx: da.cx + (dest.cx - da.cx) * e, cy: da.cy + (dest.cy - da.cy) * e, s: Math.exp(l0 + (l1 - l0) * e) }, false);
        contaFotogramma(S, t || performance.now());
        requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
      setTimeout(function () { if (S.mossa === mossa) metti(S, dest, true); fineMovimento(S); fine(); }, ms);   // arriva comunque, anche se lo schermo non ridisegna
    });
  }
  // Se il telefono fatica mentre la telecamera si muove (tanti fotogrammi saltati in più movimenti), spengo le luci che ballano:
  // prima di tutto la fluidità. Vale solo per questa partita.
  function contaFotogramma(S, t) {
    var m = S.misura || (S.misura = { ult: 0, dt: [], mosse: 0, male: 0 });
    if (m.ult && t - m.ult > 0 && t - m.ult < 250) m.dt.push(t - m.ult);
    m.ult = t;
  }
  function fineMovimento(S) {
    var m = S.misura; if (!m) return;
    var d = m.dt.slice(3).sort(function (a, b) { return a - b; }); m.dt = []; m.ult = 0;
    if (d.length < 12 || S.leggeroAuto || LEGGERO) return;
    var base = Math.max(d[Math.floor(d.length * 0.1)], 1), lenti = 0, soglia = Math.max(base * 1.8, 25);
    d.forEach(function (x) { if (x > soglia) lenti++; });
    m.mosse++; if (lenti / d.length > 0.25) m.male++;
    if (m.mosse >= 3 && m.male >= 2) {
      S.leggeroAuto = true; S.vista.classList.add("st-leggero", "st-leggero-auto");
      try { console.info("[studio] il telefono fatica: tolgo le luci che ballano"); } catch (e) {}
    }
  }
  function inquadra(S, shot, ms) { S.shot = shot; return camera(S, shot(), ms); }
  function suSchermo(S, ms) { return inquadra(S, function () { return S.R.schermo; }, ms); }
  function largo(S, ms) { return inquadra(S, function () { return { x: 0, y: 0, w: S.W, h: S.H }; }, ms); }
  function suLeggio(S, i, ms) {
    return inquadra(S, function () {
      var p = S.posti[i] || S.posti[0], w = Math.max(0.64 * S.VW, p.w * 1.5), h = w * S.VH / S.VW;
      var x = Math.max(0, Math.min(S.W - w, p.cx - w / 2)), y = Math.max(0, Math.min(S.H - h, p.top + p.w * 0.72 - h / 2));   // mai fuori dallo studio
      return { x: x, y: y, w: w, h: h };
    }, ms);
  }
  function suPubblico(S, lato, ms) { return inquadra(S, function () { return { x: lato ? 1.5 * S.VW : 0, y: 0.06 * S.VH, w: 0.5 * S.VW, h: 1.1 * S.VH }; }, ms); }
  // panoramica lungo una fila di leggii: fn(i) viene chiamata quando la telecamera passa davanti al leggio i
  async function panFila(S, fila, ms, fn) {
    var idx = []; S.posti.forEach(function (p, i) { if (p.fila === fila) idx.push(i); });
    idx.sort(function (a, b) { return S.posti[a].cx - S.posti[b].cx; });
    if (!idx.length) return;
    var w = 0.9 * S.VW, h = 0.9 * S.VH;
    function rett(cx) { var p = S.posti[idx[0]]; return { x: Math.max(0, Math.min(S.W - w, cx - w / 2)), y: p.top + p.w * 0.66 - h / 2, w: w, h: h }; }
    var a = S.posti[idx[0]].cx, b = S.posti[idx[idx.length - 1]].cx;
    await inquadra(S, function () { return rett(a); }, 700);
    idx.forEach(function (i, k) { setTimeout(function () { if (fn) fn(i); }, idx.length > 1 ? k * ms / (idx.length - 1) * 0.9 : 0); });
    await inquadra(S, function () { return rett(b); }, ms);
  }

  // ---------- pezzi dello spettacolo ----------
  function fermaTimer(S) { if (S.timer && S.timer._stop) S.timer._stop(); S.timer = null; }
  function terzo(S, i, testo, sotto, ic) {
    var el = S.t.el, T = S.terzoEl; vuota(T);
    T.style.setProperty("--col", i != null && i >= 0 ? ST_COL[i % ST_COL.length] : "#ff3ea5");
    if (i != null && i >= 0 && S.gioc[i]) T.appendChild(el("span", { class: "fac", html: avatarDi(S.gioc[i]) }));
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
  function accendiSolo(S, i) { S.L.forEach(function (X, k) { X.el.classList.toggle("acceso", k === i); }); }
  function faccia(S, i, f) { var X = S.L[i]; if (!X || X.faccia === (f || null)) return; X.faccia = f || null; mettiAvatar(X, S.gioc[i], f); }
  function tutteNormali(S) { S.L.forEach(function (X, i) { faccia(S, i, null); }); }
  function puntiLeggio(S, i, valore, delta) {
    var X = S.L[i]; if (!X) return;
    var da = X.valore; X.valore = valore;
    function punti(n) { return (n < 0 ? "−" : "") + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }   // cifre col punto: 1.500
    function scrivi(v) { var tx = punti(v); if (X.disp && !X.disp.testo && X.disp.t === tx) return; X.disp = { t: tx, neg: v < 0, testo: false }; disegnaBanco(X); }
    if (!delta) return scrivi(valore);
    X.delta.textContent = (delta > 0 ? "+" : "−") + punti(Math.abs(delta));
    X.delta.style.color = delta > 0 ? "#6ff0a6" : "#ff8d98";
    X.delta.classList.remove("on"); void X.delta.offsetWidth; X.delta.classList.add("on");
    var t0 = performance.now();
    (function passo() { var p = Math.min(1, (performance.now() - t0) / 800); scrivi(Math.round(da + (valore - da) * p)); if (p < 1) requestAnimationFrame(passo); })();
    setTimeout(function () { scrivi(valore); }, 900);   // anche se l'animazione non gira
  }
  function cartello(S, i, stato, voto) {
    var X = S.L[i]; if (!X) return;
    var r = X.cart.querySelector(".f.r");
    if (stato === "giu") { X.cart.classList.remove("su", "gira"); return; }
    if (voto != null) { r.className = "f r " + (voto ? "si" : "no"); r.textContent = voto ? "👍" : "👎"; }
    X.cart.classList.add("su");
    if (stato === "gira") X.cart.classList.add("gira");
  }
  function cartelliGiu(S) { S.L.forEach(function (X, i) { cartello(S, i, "giu"); }); }
  function pubblico(S, tipo) {
    var testi = { applauso: ["👏 Bravo!", "👏👏👏", "🔥 Grande!", "👏 Evviva!"], ohh: ["😮 Ohhh…", "😱 Nooo!", "😬 Ahia…"] };
    var l = testi[tipo] || testi.applauso;
    S.fumetto.textContent = l[Math.floor(Math.random() * l.length)];
    S.fumetto.classList.remove("on"); void S.fumetto.offsetWidth; S.fumetto.classList.add("on");
    if (tipo !== "ohh") {   // "applauso", "ovazione" (chi vince: coi fischi) o "piano" (applauso di cortesia)
      S.pubWrap.classList.add("salta");
      S.flash.forEach(function (f, k) { setTimeout(function () { f.classList.remove("on"); void f.offsetWidth; f.classList.add("on"); }, 100 + Math.random() * 1300); });
      setTimeout(function () { S.pubWrap.classList.remove("salta"); }, tipo === "ovazione" ? 2800 : 1900);
      FX.applauso(tipo === "ovazione" ? "forte" : tipo === "piano" ? "piano" : null);
    } else FX.ohh();
  }
  function logoSchermo(S) {
    fermaTimer(S);
    var el = S.t.el; vuota(S.sch);
    var logo = el("div", { class: "logo" }); S.logo.forEach(function (r, k) { if (k) logo.appendChild(el("br")); logo.appendChild(document.createTextNode(r)); });
    S.sch.appendChild(el("div", { class: "st-idle" }, [ el("div", { class: "stelle", text: "★ ★ ★" }), logo, el("div", { class: "sotto", text: "il game show" }) ]));
  }

  // ---------- LA REGIA: i momenti dello spettacolo ----------
  async function apertura(S) {
    viaBarra(S); logoSchermo(S);
    if (S.pubPronto) await S.pubPronto;   // le facce del pubblico pronte prima di muovere la telecamera
    await suPubblico(S, 0, 0);
    terzo(S, null, "In diretta dallo studio", S.titolo || "", "📺");
    pubblico(S, "applauso");
    await dorme(600); await suSchermo(S, 1600); await dorme(400); await suPubblico(S, 1, 1600); viaTerzo(S);
    await largo(S, 1300); await dorme(400);
    if (S.gioc.length <= 4) {
      for (var i = 0; i < S.gioc.length; i++) {
        if (!S.vivo()) return;
        await suLeggio(S, i, 850); accendiSolo(S, i); faccia(S, i, "esulta");
        terzo(S, i, S.gioc[i].nome, i === S.io ? "Sei tu! In bocca al lupo" : "Concorrente n° " + (i + 1));
        pubblico(S, "piano");   // il pubblico accoglie ogni concorrente
        await dorme(700); faccia(S, i, null); viaTerzo(S);
      }
      accendiSolo(S, -1);
    } else {
      for (var f = 0; f < S.file; f++) {
        if (!S.vivo()) return;
        var quanti = S.posti.filter(function (p) { return p.fila === f; }).length;
        terzo(S, null, f === 0 ? "Ecco i concorrenti!" : "…e in seconda fila!", quanti + " concorrenti", "🎤");
        pubblico(S, "applauso");
        await panFila(S, f, 2600, function (k) { accendi(S, k, true); faccia(S, k, "esulta"); setTimeout(function () { accendi(S, k, false); faccia(S, k, null); }, 900); });
      }
      viaTerzo(S);
    }
    await largo(S, 1000); await dorme(300);
  }
  // stacco su chi gioca prima di andare sul maxischermo
  async function stacco(S, gi, sotto) {
    viaBarra(S); cartelliGiu(S); tutteNormali(S);
    accendiSolo(S, gi);
    await suLeggio(S, gi, 900);
    faccia(S, gi, "pensa");
    terzo(S, gi, "Tocca a " + (S.gioc[gi] ? S.gioc[gi].nome : ""), sotto);
    pubblico(S, "piano");
    await dorme(1300);
    viaTerzo(S); faccia(S, gi, null);
  }
  async function finale(S, vinc, sotto) {
    viaBarra(S); fermaTimer(S); logoSchermo(S); cartelliGiu(S);
    await largo(S, 1000);
    terzo(S, null, "Fine della puntata!", "E il vincitore è…", "🏁");
    FX.rullo(1.6);
    await dorme(1800); viaTerzo(S);
    if (vinc >= 0) {
      lampo(S); accendiSolo(S, vinc);
      await suLeggio(S, vinc, 1100);
      faccia(S, vinc, "esulta");
      terzo(S, vinc, (S.gioc[vinc] ? S.gioc[vinc].nome : "") + " vince!", sotto || "", "🏆");
      pubblico(S, "ovazione"); coriandoli(); FX.fanfara();
      await dorme(3000); viaTerzo(S);
    }
    await largo(S, 1400); await dorme(700);
  }


  // ---- pezzi in più per i giochi (es. la bomba della Patata) ----
  // scritta libera sul display del leggio (al posto dei punti): es. "IN GARA", "💀 OUT", il countdown
  function testoLeggio(S, i, testo, neg) {
    var X = S.L[i]; if (!X) return; testo = String(testo);
    if (X.disp && X.disp.testo && X.disp.t === testo && X.disp.neg === !!neg) return;   // uguale a prima: non ridisegno
    X.disp = { t: testo, neg: !!neg, testo: true }; disegnaBanco(X);
  }
  // quali leggii si possono toccare (anello verde che pulsa); lista di indici
  function tocca(S, lista) { S.L.forEach(function (X, k) { X.el.classList.toggle("tocca", lista.indexOf(k) >= 0); }); }
  function fuori(S, i, on) {
    var X = S.L[i]; if (!X) return; X.el.classList.toggle("fuori", !!on);
    if (!!X.grigio !== !!on) { X.grigio = !!on; mettiAvatar(X, S.gioc[i], X.faccia); disegnaBanco(X); }   // avatar e bancone in bianco e nero
  }
  // la telecamera trema (un'esplosione): la muovo io, così lo studio non si ridisegna
  function scossa(S) {
    var e = S.scena, t0 = performance.now(), D = 550, id = S.scossaId = (S.scossaId || 0) + 1;
    var K = [[0, 0, 0], [0.15, -9, 5], [0.3, 8, -6], [0.45, -6, -3], [0.6, 5, 4], [0.8, -2, 1], [1, 0, 0]];
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
  // punto del mondo sopra la testa del concorrente i (per metterci sopra una cosa, es. la bomba)
  function sopraTesta(S, i) { var p = S.posti[i] || S.posti[0]; return { x: p.cx, y: p.top, w: p.w }; }

  window.SGStudio = {
    crea: creaStudio, camera: camera, inquadra: inquadra, suSchermo: suSchermo, largo: largo, suLeggio: suLeggio, suPubblico: suPubblico, panFila: panFila,
    terzo: terzo, viaTerzo: viaTerzo, barra: barra, viaBarra: viaBarra, aspettaTasto: aspettaTasto, lampo: lampo,
    accendi: accendi, accendiSolo: accendiSolo, faccia: faccia, tutteNormali: tutteNormali, puntiLeggio: puntiLeggio,
    cartello: cartello, cartelliGiu: cartelliGiu, pubblico: pubblico, logoSchermo: logoSchermo, fermaTimer: fermaTimer,
    apertura: apertura, stacco: stacco, finale: finale,
    testoLeggio: testoLeggio, tocca: tocca, fuori: fuori, scossa: scossa, sopraTesta: sopraTesta,
    avatarDi: avatarDi, mioAvatar: mioAvatar, avatarValido: avatarValido, coriandoli: coriandoli,
    raggi: raggi, rullo: rullo,
    dorme: dorme, vuota: vuota, durataApertura: durataApertura, STACCO: STACCO, FX: FX, COLORI: ST_COL
  };
})();
