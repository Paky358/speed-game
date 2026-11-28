// 🏟️ GLI SFONDI DEL LIBRO DELL'ALBUM «IN TEMA STADIO» (28 nov 2026, novità v463; il proprietario ha scelto la versione B «Stadio»; le prove
// A e C restano qui per le foto: .agents/skills/prova-nel-browser/album/libro2-foto.js).
// Tutto disegnato dal codice su una tela, UNA volta sola quando la pagina nasce: poi resta ferma (niente si muove mentre si sfoglia).
// window.L2S.pagina(cv, sq, pag, liv)  → lo sfondo della pagina 1 o 2 di una squadra (liv "A" sobria, "B" stadio, "C" gran galà)
// window.L2S.copertina(cv, liv, luce)  → lo stadio di notte della copertina (luce: null = spenta, 0-3 = un riflettore, "campo" = il prato acceso)
// window.L2S.indice(cv, liv)           → il campo visto dall'alto dell'indice
// Le città sono MONUMENTI disegnati da noi, semplici (sagome): niente stemmi, animali, scritte dei club né foto.
(function () {
  "use strict";
  // ---- i colori di ogni squadra (per le luci, la trama e i coriandoli) ----
  var TINTE = {
    Atalanta: ["#2f7fd0", "#1a1c26"], Bologna: ["#c8202f", "#1f3a8a"], Cagliari: ["#c8202f", "#1f3a8a"], Como: ["#2a5fd0", "#e9eef8"],
    Fiorentina: ["#7a3cc0", "#e9e4f4"], Frosinone: ["#f2c230", "#1f4fb8"], Genoa: ["#c8202f", "#1f3a8a"], Inter: ["#1f5fe0", "#0f1220"],
    Juventus: ["#e9edf3", "#0f1220"], Lazio: ["#8cc6ea", "#eaf4fb"], Lecce: ["#f2c230", "#c8202f"], Milan: ["#e0222f", "#0f1220"],
    Monza: ["#e0222f", "#f1f1f1"], Napoli: ["#1c8fd6", "#e9f4fc"], Parma: ["#f2c230", "#1f4aa8"], Roma: ["#b0203a", "#f0b43a"],
    Sassuolo: ["#1fa55a", "#0f1220"], Torino: ["#9a2430", "#efe6e6"], Udinese: ["#e9edf3", "#0f1220"], Venezia: ["#e0701e", "#1f8a4c"],
    Benevento: ["#f2c230", "#c8202f"], Brescia: ["#1f4fb8", "#e9eef8"], Carpi: ["#c8202f", "#f1f1f1"], Chievo: ["#f2c230", "#1f3a8a"],
    Cremonese: ["#c8202f", "#9aa0a8"], Crotone: ["#c8202f", "#1f3a8a"], Empoli: ["#2f7fd0", "#e9eef8"], Palermo: ["#e889b0", "#0f1220"],
    Pescara: ["#8cc6ea", "#eaf4fb"], Pisa: ["#1f3a8a", "#0f1220"], SPAL: ["#8cc6ea", "#f1f1f1"], Salernitana: ["#8a1f28", "#efe6e6"],
    Sampdoria: ["#1f4fb8", "#c8202f"], Spezia: ["#e9edf3", "#0f1220"], Verona: ["#f2c230", "#1f3a8a"]
  };
  // il segno della squadra ripetuto leggerissimo (lo stesso dello scudetto)
  var TRAMA = {
    Atalanta: "diag", Bologna: "righe", Cagliari: "mezzo", Como: "croce", Fiorentina: "vee", Frosinone: "diag", Genoa: "croce", Inter: "righe",
    Juventus: "righe", Lazio: "fascia", Lecce: "righe", Milan: "righe", Monza: "fascia", Napoli: "onda", Parma: "righe", Roma: "fascia",
    Sassuolo: "righe", Torino: "fascia", Udinese: "punta", Venezia: "righe", Benevento: "mezzo", Brescia: "vee", Carpi: "righe", Chievo: "fascia",
    Cremonese: "righe", Crotone: "fascia", Empoli: "diag", Palermo: "mezzo", Pescara: "fascia", Pisa: "fascia", SPAL: "righe", Salernitana: "diag",
    Sampdoria: "fascia", Spezia: "fascia", Verona: "mezzo"
  };
  function rgb(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return "#" + [0, 1, 2].map(function (i) { var v = Math.round(x[i] + (y[i] - x[i]) * t); return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }
  function rgba(h, a) { var x = rgb(h); return "rgba(" + x[0] + "," + x[1] + "," + x[2] + "," + a + ")"; }
  function luce(h) { var x = rgb(h), l = (x[0] * 0.3 + x[1] * 0.59 + x[2] * 0.11); return l < 60 ? mix(h, "#8fa6ff", 0.55) : h; }   // (il nero non fa luce: diventa blu notte chiaro)
  function tinte(sq) { var t = TINTE[sq] || ["#5a6ab0", "#c9cfe6"]; return { c1: t[0], c2: t[1], l1: luce(t[0]), l2: luce(t[1]) }; }
  function rnd(seme) { var s = 0; for (var i = 0; i < seme.length; i++) s = (s * 31 + seme.charCodeAt(i)) >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function tela(w, h, dpr) { var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr)); var x = c.getContext("2d"); x.scale(dpr, dpr); return { c: c, x: x }; }
  function prepara(cv) { var dpr = Math.min(3, window.devicePixelRatio || 1), w = cv.clientWidth || cv.width, h = cv.clientHeight || cv.height; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); var x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); return { x: x, w: w, h: h, dpr: dpr }; }

  // ---- LE CITTÀ: sagome di monumenti (x da 0 a 1 = larghezza della pagina, altezze in «larghezze di pagina») ----
  function M(x, u, base, k) {   // i pennelli: tutti riempiono di nero (poi la sagoma prende il colore)
    var m = {
      X: function (a) { return a * u; }, Y: function (h, y0) { return base - ((y0 || 0) + h) * u * k; },
      r: function (a, w, h, y0) { x.fillRect(a * u, base - ((y0 || 0) + h) * u * k, w * u, h * u * k + 0.5); },
      t: function (a, w, h, y0) { x.beginPath(); x.moveTo(a * u, m.Y(0, y0)); x.lineTo((a + w / 2) * u, m.Y(h, y0)); x.lineTo((a + w) * u, m.Y(0, y0)); x.closePath(); x.fill(); },
      d: function (cx, rx, ry, y0) { x.beginPath(); x.ellipse(cx * u, m.Y(0, y0), rx * u, ry * u * k, 0, Math.PI, 0); x.closePath(); x.fill(); },
      o: function (cx, rx, ry, y0) { var b = m.Y(0, y0), t = m.Y(ry, y0); x.beginPath(); x.moveTo((cx - rx) * u, b); x.quadraticCurveTo((cx - rx) * u, b - (b - t) * 0.65, cx * u, t); x.quadraticCurveTo((cx + rx) * u, b - (b - t) * 0.65, (cx + rx) * u, b); x.closePath(); x.fill(); },
      p: function (pts) { x.beginPath(); pts.forEach(function (q, i) { var px = q[0] * u, py = m.Y(q[1]); if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.closePath(); x.fill(); },
      c: function (cx, h, r) { x.beginPath(); x.arc(cx * u, m.Y(h), r * u, 0, Math.PI * 2); x.fill(); },
      ago: function (cx, w, h, y0) { m.t(cx - w / 2, w, h, y0); },
      colle: function (a, b, h) { x.beginPath(); x.moveTo(a * u, base + 1); x.bezierCurveTo((a + (b - a) * 0.3) * u, m.Y(h), (a + (b - a) * 0.7) * u, m.Y(h), b * u, base + 1); x.closePath(); x.fill(); },
      merli: function (a, w, y0, n) { var mw = w / (n * 2 - 1); for (var i = 0; i < n; i++) m.r(a + i * 2 * mw, mw, 0.012, y0); },
      fori: function (a, w, h, y0, n, alto) {   // una fila di archi bucati (finestre e portici)
        x.save(); x.globalCompositeOperation = "destination-out"; var g = w / n;
        for (var i = 0; i < n; i++) { var cx = (a + g * i + g / 2) * u, rw = g * 0.32 * u, b = m.Y(0, y0), t = m.Y(h * (alto || 0.8), y0); x.beginPath(); x.moveTo(cx - rw, b); x.lineTo(cx - rw, t + rw); x.arc(cx, t + rw, rw, Math.PI, 0); x.lineTo(cx + rw, b); x.closePath(); x.fill(); }
        x.restore();
      },
      case: function (a, b, hmin, hmax, r) { for (var q = a; q < b;) { var w = 0.03 + r() * 0.05; m.r(q, w + 0.002, hmin + r() * (hmax - hmin)); q += w; } }
    };
    return m;
  }
  function colosseo(m, a, w, h) {
    m.p([[a, 0], [a, h * 0.92], [a + w * 0.08, h], [a + w * 0.92, h], [a + w, h * 0.92], [a + w, 0]]);
    m.fori(a + w * 0.02, w * 0.96, h * 0.3, 0.004, 9, 0.85); m.fori(a + w * 0.04, w * 0.92, h * 0.27, h * 0.33, 9, 0.85); m.fori(a + w * 0.06, w * 0.88, h * 0.22, h * 0.63, 9, 0.8);
    var x = m.__x; x.save(); x.globalCompositeOperation = "destination-out"; x.beginPath(); x.moveTo(m.X(a + w * 0.62), m.Y(h + 0.01)); x.lineTo(m.X(a + w + 0.01), m.Y(h + 0.01)); x.lineTo(m.X(a + w + 0.01), m.Y(h * 0.45)); x.lineTo(m.X(a + w * 0.86), m.Y(h * 0.62)); x.lineTo(m.X(a + w * 0.74), m.Y(h * 0.8)); x.closePath(); x.fill(); x.restore();
  }
  function duomoMI(m, a, w) {   // il Duomo di Milano: la facciata, le guglie e la Madonnina
    m.r(a, w, 0.12); m.t(a + w * 0.2, w * 0.6, 0.05, 0.12);
    for (var i = 0; i <= 8; i++) { var cx = a + w * i / 8; m.r(cx - 0.004, 0.008, 0.055, 0.12); m.ago(cx, 0.012, 0.03, 0.175); }
    m.r(a + w * 0.47, w * 0.06, 0.12, 0.13); m.ago(a + w * 0.5, w * 0.07, 0.12, 0.25); m.c(a + w * 0.5, 0.38, 0.006);
    m.fori(a + w * 0.08, w * 0.84, 0.08, 0, 5, 0.9);
  }
  function mole(m, a) {   // la Mole Antonelliana
    m.r(a, 0.16, 0.08); m.r(a + 0.01, 0.14, 0.03, 0.08); m.p([[a + 0.015, 0.11], [a + 0.05, 0.27], [a + 0.11, 0.27], [a + 0.145, 0.11]]);
    m.r(a + 0.055, 0.05, 0.05, 0.27); m.ago(a + 0.08, 0.04, 0.22, 0.32); m.fori(a + 0.01, 0.14, 0.06, 0, 5, 0.9);
  }
  function cupolaSP(m, cx, s) { m.r(cx - 0.07 * s, 0.14 * s, 0.07 * s); m.r(cx - 0.055 * s, 0.11 * s, 0.035 * s, 0.07 * s); m.o(cx, 0.06 * s, 0.11 * s, 0.105 * s); m.r(cx - 0.009 * s, 0.018 * s, 0.03 * s, 0.2 * s); m.ago(cx, 0.014 * s, 0.03 * s, 0.23 * s); }
  function campanile(m, a, w, h, punta) { m.r(a, w, h); m.fori(a, w, 0.05, h - 0.07, 1, 0.9); if (punta === "piramide") m.t(a - 0.004, w + 0.008, w * 1.6, h); else if (punta === "ago") m.ago(a + w / 2, w * 0.7, w * 2.6, h); else m.merli(a, w, h, 3); }
  function acqua(m, y) { var x = m.__x; x.fillRect(0, m.Y(0) - 0.5, m.X(1), m.X(y)); }
  var CITTA = {
    Napoli: { far: function (m) { m.case(0, 1, 0.03, 0.07, m.__r); },
      near: function (m) { m.p([[0.3, 0], [0.5, 0.2], [0.56, 0.22], [0.6, 0.19], [0.66, 0.26], [0.73, 0.25], [0.98, 0.05], [1.05, 0]]); m.r(0.04, 0.24, 0.06); m.merli(0.04, 0.24, 0.06, 7); m.r(0.2, 0.06, 0.1); m.merli(0.2, 0.06, 0.1, 3); }, mare: 1 },
    Roma: { far: function (m) { m.case(0, 1, 0.03, 0.07, m.__r); cupolaSP(m, 0.82, 1.1); }, near: function (m) { colosseo(m, 0.06, 0.56, 0.2); } },
    Lazio: { far: function (m) { m.case(0, 1, 0.03, 0.06, m.__r); m.r(0.04, 0.34, 0.1); m.fori(0.05, 0.32, 0.08, 0, 12, 1); m.r(0.03, 0.04, 0.03, 0.1); m.r(0.35, 0.04, 0.03, 0.1); m.t(0.14, 0.12, 0.03, 0.1); },
      near: function (m) { colosseo(m, 0.42, 0.54, 0.2); } },
    Inter: { far: function (m) { m.case(0, 1, 0.03, 0.08, m.__r); [[0.72, 0.3], [0.84, 0.26]].forEach(function (t) { m.r(t[0], 0.07, t[1]); for (var i = 0; i < 9; i++) { m.c(t[0], t[1] * i / 9 + 0.02, 0.012); m.c(t[0] + 0.07, t[1] * i / 9 + 0.03, 0.012); } }); },
      near: function (m) { duomoMI(m, 0.12, 0.46); } },
    Milan: { far: function (m) { m.case(0, 1, 0.03, 0.08, m.__r); m.r(0.1, 0.06, 0.24); m.p([[0.085, 0.24], [0.1, 0.235], [0.16, 0.235], [0.175, 0.24], [0.175, 0.32], [0.085, 0.32]]); m.r(0.12, 0.003, 0.04, 0.32); },
      near: function (m) { duomoMI(m, 0.42, 0.46); } },
    Juventus: { far: function (m) { m.p([[0, 0], [0, 0.1], [0.12, 0.2], [0.2, 0.13], [0.32, 0.26], [0.42, 0.15], [0.55, 0.24], [0.68, 0.12], [0.8, 0.22], [0.92, 0.14], [1, 0.18], [1, 0]]); },
      near: function (m) { m.case(0, 0.36, 0.03, 0.07, m.__r); m.case(0.56, 1, 0.03, 0.07, m.__r); mole(m, 0.38); } },
    Torino: { far: function (m) { m.colle(0.48, 1.02, 0.17); cupolaSP(m, 0.76, 0.55); m.r(0.69, 0.012, 0.06, 0.16); m.r(0.82, 0.012, 0.06, 0.16); },
      near: function (m) { m.case(0, 0.12, 0.03, 0.06, m.__r); mole(m, 0.14); m.case(0.3, 1, 0.02, 0.05, m.__r); } },
    Fiorentina: { far: function (m) { m.case(0, 1, 0.03, 0.06, m.__r); m.r(0.06, 0.15, 0.12); m.merli(0.06, 0.15, 0.12, 6); m.r(0.12, 0.035, 0.28); m.merli(0.115, 0.045, 0.28, 2); m.r(0.128, 0.02, 0.05, 0.29); },
      near: function (m) { m.r(0.28, 0.28, 0.08); m.r(0.32, 0.2, 0.05, 0.08); m.o(0.42, 0.105, 0.17, 0.13); m.r(0.41, 0.02, 0.04, 0.3); m.ago(0.42, 0.02, 0.03, 0.34); m.r(0.6, 0.065, 0.32); m.fori(0.6, 0.065, 0.06, 0.24, 1, 0.9); m.fori(0.6, 0.065, 0.06, 0.15, 1, 0.9); } },
    Genoa: { far: function (m) { m.case(0, 0.5, 0.04, 0.09, m.__r); [0.08, 0.2].forEach(function (a) { m.r(a, 0.012, 0.18); m.p([[a - 0.02, 0.18], [a + 0.12, 0.2], [a + 0.12, 0.21], [a - 0.02, 0.195]]); }); },
      near: function (m) { m.colle(0.5, 0.82, 0.06); m.r(0.635, 0.05, 0.16, 0.05); m.r(0.645, 0.04, 0.13, 0.21); m.r(0.632, 0.066, 0.012, 0.2); m.r(0.632, 0.066, 0.012, 0.34); m.r(0.652, 0.026, 0.04, 0.352); m.d(0.665, 0.016, 0.02, 0.392); }, mare: 1 },
    Bologna: { far: function (m) { m.case(0, 1, 0.03, 0.07, m.__r); m.p([[0.06, 0], [0.06, 0.13], [0.19, 0.17], [0.32, 0.13], [0.32, 0]]); },
      near: function (m) { m.r(0.44, 0.05, 0.5); m.merli(0.435, 0.06, 0.5, 2); m.p([[0.53, 0], [0.555, 0.27], [0.605, 0.265], [0.585, 0]]); m.r(0.3, 0.12, 0.06); m.fori(0.3, 0.12, 0.05, 0, 4, 0.9); m.r(0.66, 0.2, 0.06); m.fori(0.66, 0.2, 0.05, 0, 6, 0.9); } },
    Atalanta: { far: function (m) { m.colle(-0.1, 0.95, 0.12); },
      near: function (m) { m.r(0.08, 0.7, 0.04, 0.1); m.merli(0.08, 0.7, 0.14, 14); m.case(0.12, 0.74, 0.04, 0.09, m.__r); m.r(0.34, 0.05, 0.26, 0.1); m.merli(0.335, 0.06, 0.36, 2); m.r(0.5, 0.08, 0.06, 0.12); m.o(0.54, 0.04, 0.08, 0.18); m.r(0.6, 0.03, 0.2, 0.1); m.ago(0.615, 0.03, 0.06, 0.3); } },
    Cagliari: { far: function (m) { m.colle(0.1, 0.95, 0.1); m.case(0.2, 0.9, 0.06, 0.13, m.__r); },
      near: function (m) { m.p([[0.22, 0], [0.22, 0.1], [0.3, 0.1], [0.3, 0.14], [0.7, 0.14], [0.7, 0.1], [0.78, 0.1], [0.78, 0]]); m.fori(0.24, 0.52, 0.09, 0, 7, 0.95); m.fori(0.32, 0.36, 0.035, 0.1, 6, 0.9); m.r(0.1, 0.06, 0.22); m.merli(0.1, 0.06, 0.22, 3); }, mare: 1 },
    Como: { far: function (m) { m.p([[0, 0], [0, 0.16], [0.16, 0.26], [0.3, 0.17], [0.44, 0.24], [0.6, 0.14], [0.78, 0.25], [0.92, 0.18], [1, 0.22], [1, 0]]); },
      near: function (m) { m.case(0.3, 0.9, 0.03, 0.06, m.__r); m.r(0.5, 0.12, 0.08); m.r(0.525, 0.07, 0.04, 0.08); m.d(0.56, 0.045, 0.08, 0.12); m.r(0.553, 0.014, 0.04, 0.19); m.r(0.08, 0.14, 0.012); m.r(0.09, 0.12, 0.045, 0.012); m.fori(0.09, 0.12, 0.045, 0.012, 5, 1); m.d(0.15, 0.06, 0.035, 0.057); }, mare: 1 },
    Frosinone: { far: function (m) { m.colle(-0.2, 0.7, 0.16); m.colle(0.4, 1.2, 0.11); },
      near: function (m) { m.colle(0.15, 0.85, 0.08); m.case(0.25, 0.75, 0.05, 0.13, m.__r); campanile(m, 0.47, 0.055, 0.32, "piramide"); } },
    Lecce: { far: function (m) { m.case(0, 1, 0.03, 0.07, m.__r); m.r(0.08, 0.28, 0.13); for (var i = 0; i < 7; i++) m.d(0.1 + i * 0.04, 0.02, 0.03, 0.13); m.fori(0.08, 0.28, 0.1, 0, 3, 0.9); },
      near: function (m) { [[0.6, 0.09, 0.1], [0.61, 0.07, 0.1], [0.62, 0.05, 0.1], [0.628, 0.034, 0.08]].forEach(function (q, i) { m.r(q[0], q[1], q[2], [0, 0.1, 0.2, 0.3][i]); }); m.d(0.645, 0.02, 0.04, 0.38); m.r(0.78, 0.16, 0.16); m.t(0.77, 0.18, 0.04, 0.16); m.fori(0.8, 0.12, 0.13, 0, 1, 0.95); } },
    Monza: { far: function (m) { for (var i = 0; i < 12; i++) m.c(0.04 + i * 0.09, 0.07 + (i % 3) * 0.02, 0.05); },
      near: function (m) { m.r(0.1, 0.8, 0.09); m.r(0.38, 0.24, 0.05, 0.09); m.t(0.42, 0.16, 0.03, 0.14); m.fori(0.12, 0.76, 0.06, 0.012, 14, 1); m.fori(0.4, 0.2, 0.035, 0.095, 5, 1); } },
    Parma: { far: function (m) { m.case(0, 1, 0.03, 0.07, m.__r); m.p([[0.5, 0], [0.5, 0.13], [0.62, 0.2], [0.74, 0.13], [0.74, 0]]); m.r(0.77, 0.045, 0.3); m.ago(0.7925, 0.04, 0.1, 0.3); },
      near: function (m) { m.r(0.22, 0.16, 0.22); m.r(0.215, 0.17, 0.012, 0.07); m.r(0.215, 0.17, 0.012, 0.14); for (var i = 0; i < 4; i++) m.ago(0.23 + i * 0.047, 0.018, 0.05, 0.22); m.fori(0.23, 0.14, 0.06, 0, 3, 0.9); } },
    Sassuolo: { far: function (m) { m.p([[0, 0], [0, 0.12], [0.2, 0.18], [0.45, 0.11], [0.7, 0.2], [1, 0.12], [1, 0]]); },
      near: function (m) { m.r(0.2, 0.6, 0.12); m.r(0.18, 0.09, 0.18); m.r(0.73, 0.09, 0.18); m.merli(0.18, 0.09, 0.18, 3); m.merli(0.73, 0.09, 0.18, 3); m.fori(0.3, 0.4, 0.08, 0.01, 7, 0.9); } },
    Udinese: { far: function (m) { m.colle(0.35, 1.05, 0.12); m.r(0.5, 0.28, 0.1, 0.1); m.r(0.6, 0.03, 0.12, 0.2); m.c(0.615, 0.34, 0.012); },
      near: function (m) { m.r(0.04, 0.3, 0.1); m.t(0.02, 0.34, 0.04, 0.1); m.fori(0.05, 0.28, 0.08, 0, 5, 0.85); m.case(0.36, 0.5, 0.03, 0.06, m.__r); } },
    Venezia: { far: function (m) { m.r(0.78, 0.16, 0.08); m.d(0.86, 0.075, 0.12, 0.08); m.r(0.855, 0.01, 0.04, 0.2); },
      near: function (m) { campanile(m, 0.28, 0.06, 0.36, "piramide"); m.r(0.38, 0.3, 0.08); [0.44, 0.53, 0.62].forEach(function (c) { m.o(c, 0.035, 0.07, 0.08); m.r(c - 0.003, 0.006, 0.02, 0.15); }); m.fori(0.38, 0.3, 0.06, 0, 5, 0.95); m.p([[0.04, -0.01], [0.05, 0.01], [0.2, 0.004], [0.22, 0.02], [0.215, -0.005], [0.18, -0.012], [0.06, -0.012]]); }, mare: 1 }
  };
  // la città: far (lontana, più chiara e trasparente) e near (vicina, scura col filo di luce del colore della squadra sopra)
  function disegnaCitta(x, sq, w, base, k, T, opz) {
    if (!CITTA[sq]) return;   // (le squadre senza città, per ora quelle delle stagioni passate: le disegnerà Gemini; il proprietario, 28 nov 2026)
    var def = CITTA[sq], dpr = opz.dpr, r = rnd("citta|" + sq);
    function strato(fn, colore, filo, alfa) {
      var t = tela(w, base + 4, dpr), m = M(t.x, w, base, k); m.__x = t.x; m.__r = r; t.x.fillStyle = "#000"; fn(m);
      var sag = t.c, c2 = tela(w, base + 4, dpr);
      if (filo) { c2.x.globalAlpha = filo; c2.x.drawImage(sag, 0, -2, w, base + 4); c2.x.drawImage(sag, -0.8, -1.2, w, base + 4); c2.x.drawImage(sag, 0.8, -1.2, w, base + 4); c2.x.globalCompositeOperation = "source-in"; c2.x.fillStyle = T.l1; c2.x.fillRect(0, 0, w, base + 4); c2.x.globalCompositeOperation = "source-over"; c2.x.globalAlpha = 1; }
      var c3 = tela(w, base + 4, dpr); c3.x.drawImage(sag, 0, 0, w, base + 4); c3.x.globalCompositeOperation = "source-in";
      var g = c3.x.createLinearGradient(0, base - 0.45 * w * k, 0, base); g.addColorStop(0, colore[0]); g.addColorStop(1, colore[1]); c3.x.fillStyle = g; c3.x.fillRect(0, 0, w, base + 4);
      if (opz.finestre && !filo) { /* (niente) */ }
      if (opz.finestre && filo) {   // le finestre accese: puntini caldi solo dentro le sagome vicine
        c3.x.globalCompositeOperation = "source-atop"; for (var i = 0; i < 70; i++) { var fx = r() * w, fy = base - r() * 0.16 * w * k; c3.x.fillStyle = "rgba(255,214,140," + (0.25 + r() * 0.4).toFixed(2) + ")"; c3.x.fillRect(fx, fy, 1.4, 1.8); }
      }
      c2.x.drawImage(c3.c, 0, 0, w, base + 4);
      x.save(); x.globalAlpha = alfa; x.drawImage(c2.c, 0, 0, w, base + 4); x.restore();
    }
    strato(def.far, [rgba(mix("#1b2350", T.l1, 0.35), 1), rgba("#151a38", 1)], 0, opz.alfaFar);
    if (!opz.soloFar) strato(def.near, [mix("#0c1026", T.c1, 0.22), "#080a18"], 0.85, 1);
    if (def.mare && opz.mare !== false) {   // il mare (o il lago): righe di luce sull'acqua, sopra il prato
      for (var i = 0; i < 26; i++) { x.fillStyle = rgba(T.l1, (0.05 + r() * 0.12).toFixed(2)); x.fillRect(r() * w, base + 2 + r() * 8, 8 + r() * 26, 1); }
    }
  }

  // ---- 🌆 la città da un file (per i disegni di Gemini: regole nel LEGGIMI di D:/SG-album-prove/libro2) ----
  // L'immagine (larga 1080, alta 720: 3 a 2) si appoggia in fondo, sopra il prato, larga quanto la pagina; in cima sfuma nel cielo della
  // pagina (così il suo cielo non si vede mai come un rettangolo) e si scurisce un poco, perché le figurine restino le più luminose.
  // Nella 2ª pagina della squadra è più bassa e più spenta (la parte più ricca è la 1ª).
  function cittaFoto(x, img, w, h, base, T, dpr, ricco) {
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if (!iw || !ih) return;
    var dh = Math.min(w * ih / iw, h * (ricco ? 0.55 : 0.32)), dw = dh * iw / ih, dx = (w - dw) / 2, dy = base - dh;
    if (dw < w) { dw = w; dh = w * ih / iw; dx = 0; dy = base - dh; }   // (sempre larga quanto la pagina: se serve, la cima esce di sopra)
    var t = tela(w, h, dpr); t.x.drawImage(img, dx, dy, dw, dh);
    t.x.globalCompositeOperation = "destination-in"; var g = t.x.createLinearGradient(0, base - Math.min(dh, h * (ricco ? 0.55 : 0.32)), 0, base);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.35, "rgba(0,0,0,.85)"); g.addColorStop(1, "rgba(0,0,0,1)"); t.x.fillStyle = g; t.x.fillRect(0, 0, w, h);
    t.x.globalCompositeOperation = "source-atop"; t.x.fillStyle = "rgba(6,8,22," + (ricco ? 0.22 : 0.45) + ")"; t.x.fillRect(0, 0, w, h);
    x.save(); x.globalAlpha = ricco ? 0.95 : 0.7; x.drawImage(t.c, 0, 0, w, h); x.restore();
  }
  // ---- la trama col segno della squadra ----
  function trama(x, sq, w, h, alfa, T, dpr) {
    var t = tela(w, h, dpr), c = t.x, tipo = TRAMA[sq] || "righe", col = mix(T.l1, "#ffffff", 0.25), i, j;
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 6;
    if (tipo === "righe") { var n = 9, rw = w / n; for (i = 0; i < n; i += 2) c.fillRect(i * rw, 0, rw, h); }
    else if (tipo === "mezzo") { c.fillRect(0, 0, w / 2, h); }
    else if (tipo === "fascia") { for (j = 0; j < h; j += 70) c.fillRect(0, j, w, 22); }
    else if (tipo === "diag") { c.lineWidth = 16; for (i = -h; i < w + h; i += 46) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke(); } }
    else if (tipo === "croce") { for (j = 18; j < h; j += 48) for (i = 18 + ((j / 48) % 2) * 24; i < w; i += 48) { c.fillRect(i - 7, j - 2, 14, 4); c.fillRect(i - 2, j - 7, 4, 14); } }
    else if (tipo === "vee" || tipo === "punta") { c.lineWidth = 5; var d = tipo === "vee" ? 1 : -1; for (j = 10; j < h + 30; j += 34) for (i = 0; i < w + 40; i += 40) { c.beginPath(); c.moveTo(i - 18, j - 9 * d); c.lineTo(i, j + 9 * d); c.lineTo(i + 18, j - 9 * d); c.stroke(); } }
    else if (tipo === "onda") { c.lineWidth = 4; for (j = 10; j < h + 20; j += 26) { c.beginPath(); for (i = 0; i <= w; i += 4) { var y = j + Math.sin(i / 22 + j) * 5; if (i) c.lineTo(i, y); else c.moveTo(i, y); } c.stroke(); } }
    // sfuma: più forte in alto e in basso, quasi niente in mezzo (dove stanno le figurine)
    c.globalCompositeOperation = "destination-in"; var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.32, "rgba(0,0,0,.35)"); g.addColorStop(0.62, "rgba(0,0,0,.15)"); g.addColorStop(1, "rgba(0,0,0,.6)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    x.save(); x.globalAlpha = alfa; x.drawImage(t.c, 0, 0, w, h); x.restore();
  }
  // ---- pezzi comuni ----
  function fondoNotte(x, w, h, T, forte) {
    var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#151a40"); g.addColorStop(0.55, "#0d1022"); g.addColorStop(1, "#090b18"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    var r1 = x.createRadialGradient(w * 0.5, -h * 0.05, 0, w * 0.5, -h * 0.05, h * 0.75); r1.addColorStop(0, rgba(T.l1, forte ? 0.42 : 0.3)); r1.addColorStop(1, rgba(T.l1, 0)); x.fillStyle = r1; x.fillRect(0, 0, w, h);
    var r2 = x.createRadialGradient(w * 1.05, h * 0.62, 0, w * 1.05, h * 0.62, w * 0.9); r2.addColorStop(0, rgba(T.l2, 0.12)); r2.addColorStop(1, rgba(T.l2, 0)); x.fillStyle = r2; x.fillRect(0, 0, w, h);
  }
  function riflettori(x, w, h, T, forza) {   // fasci di luce dagli angoli in alto, del colore della squadra
    [[-0.04, 1], [1.04, -1]].forEach(function (q) {
      var ox = q[0] * w, oy = -h * 0.02;
      [[0.3, 0.55, 0.13], [0.48, 0.75, 0.09]].forEach(function (b) {
        var tx = ox + q[1] * w * b[0], ty = h * b[1], g = x.createLinearGradient(ox, oy, tx, ty);
        g.addColorStop(0, rgba(mix(T.l1, "#ffffff", 0.45), b[2] * forza)); g.addColorStop(1, rgba(T.l1, 0));
        x.fillStyle = g; x.beginPath(); x.moveTo(ox, oy); x.lineTo(tx - w * 0.13, ty); x.lineTo(tx + w * 0.13, ty); x.closePath(); x.fill();
      });
      var l = x.createRadialGradient(ox, oy, 0, ox, oy, w * 0.22); l.addColorStop(0, rgba("#ffffff", 0.35 * forza)); l.addColorStop(0.3, rgba(T.l1, 0.2 * forza)); l.addColorStop(1, rgba(T.l1, 0)); x.fillStyle = l; x.fillRect(0, 0, w, h);
    });
  }
  function righeCampo(x, w, h, pag, top, base, alfa) {   // la filigrana del campo
    x.save(); x.strokeStyle = "rgba(255,255,255," + alfa + ")"; x.lineWidth = 1.6;
    if (pag === 1) { var cy = top + (base - top) * 0.55, r = w * 0.27; x.beginPath(); x.moveTo(0, cy); x.lineTo(w, cy); x.stroke(); x.beginPath(); x.arc(w / 2, cy, r, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(w / 2, cy, 3, 0, Math.PI * 2); x.fillStyle = x.strokeStyle; x.fill(); }
    else {   // l'area di rigore, vista dalla porta in fondo
      var py = base - 4, aw = w * 0.78, ah = (base - top) * 0.42, pw = w * 0.36, ph = ah * 0.38;
      x.strokeRect((w - aw) / 2, py - ah, aw, ah); x.strokeRect((w - pw) / 2, py - ph, pw, ph);
      x.beginPath(); x.arc(w / 2, py - ah * 0.7, 2.6, 0, Math.PI * 2); x.fillStyle = x.strokeStyle; x.fill();
      x.beginPath(); x.arc(w / 2, py - ah * 0.7, w * 0.2, Math.PI * 1.22, Math.PI * 1.78); x.stroke();
    }
    x.restore();
  }
  function pallone(x, cx, cy, r, alfa) {   // un pallone sfumato, grande e quasi trasparente
    x.save(); x.globalAlpha = alfa;
    var g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); g.addColorStop(0, "#ffffff"); g.addColorStop(0.7, "#c9cfe0"); g.addColorStop(1, "rgba(150,160,190,0)");
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#0b0e20"; function pent(px, py, s, rot) { x.beginPath(); for (var i = 0; i < 5; i++) { var a = rot + i * Math.PI * 2 / 5; x.lineTo(px + Math.cos(a) * s, py + Math.sin(a) * s); } x.closePath(); x.fill(); }
    pent(cx, cy, r * 0.24, -Math.PI / 2); for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * Math.PI * 2 / 5 + Math.PI / 5; pent(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72, r * 0.17, a); }
    x.restore();
  }
  function prato(x, w, h, alto, liv, r) {   // l'erba in fondo, coi fili
    var y0 = h - alto;
    if (liv === "A") { var g0 = x.createLinearGradient(0, y0, 0, h); g0.addColorStop(0, "rgba(40,130,70,.55)"); g0.addColorStop(1, "rgba(10,40,22,.9)"); x.fillStyle = g0; x.fillRect(0, y0, w, alto); }
    else {
      for (var i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#17592e" : "#1b6635"; x.beginPath(); var a = i / 8, b = (i + 1) / 8; x.moveTo(w * (a - 0.06), h); x.lineTo(w * a, y0); x.lineTo(w * b, y0); x.lineTo(w * (b + 0.06), h); x.closePath(); x.fill(); }
      var sh = x.createLinearGradient(0, y0, 0, h); sh.addColorStop(0, "rgba(160,255,170,.22)"); sh.addColorStop(0.35, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.45)"); x.fillStyle = sh; x.fillRect(0, y0, w, alto);
    }
    x.fillStyle = liv === "A" ? "rgba(70,170,95,.6)" : "#2a8a48";   // i fili d'erba sul bordo
    for (var q = 0; q < w; q += 3) { var hh = 3 + r() * (liv === "A" ? 4 : 7); x.beginPath(); x.moveTo(q, y0 + 1); x.lineTo(q + 1.2 + r() * 1.5, y0 - hh); x.lineTo(q + 2.6, y0 + 1); x.fill(); }
  }
  function tribuna(x, w, y0, alto, T, r) {   // i tifosi coi colori della squadra (puntini)
    var g = x.createLinearGradient(0, y0, 0, y0 + alto); g.addColorStop(0, "#0b0e22"); g.addColorStop(1, "#06081a"); x.fillStyle = g; x.fillRect(0, y0, w, alto);
    var cols = [T.c1, T.c2, "#ffffff", T.c1];
    for (var yy = y0 + 2; yy < y0 + alto - 2; yy += 4) for (var xx = r() * 3; xx < w; xx += 3.2 + r() * 1.5) { x.fillStyle = rgba(luce(cols[Math.floor(r() * cols.length)]), (0.18 + r() * 0.35).toFixed(2)); x.fillRect(xx, yy, 1.8, 2.2); }
    var b = x.createLinearGradient(0, y0, 0, y0 + alto); b.addColorStop(0, "rgba(6,8,22,.6)"); b.addColorStop(0.5, "rgba(6,8,22,0)"); b.addColorStop(1, "rgba(6,8,22,.5)"); x.fillStyle = b; x.fillRect(0, y0, w, alto);
    x.fillStyle = rgba(T.l1, 0.5); x.fillRect(0, y0 + alto - 2, w, 2);   // il cartellone a bordo campo
  }
  function torri(x, w, h, base, T) {   // le torri dei riflettori ai lati (gran galà)
    [[0.04, 1], [0.96, -1]].forEach(function (q) {
      var cx = q[0] * w, top = 13; x.fillStyle = "rgba(10,12,28,.8)"; x.fillRect(cx - 1, top, 2, base - top);
      x.fillStyle = "#1a1f3a"; x.fillRect(cx - 7, top - 7, 14, 9);
      for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++) { x.fillStyle = "rgba(255,250,225,.9)"; x.fillRect(cx - 6 + i * 4.3, top - 6 + j * 4, 3.2, 2.8); }
      var l = x.createRadialGradient(cx, top - 3, 0, cx, top - 3, w * 0.25); l.addColorStop(0, "rgba(255,250,230,.5)"); l.addColorStop(0.25, rgba(T.l1, 0.16)); l.addColorStop(1, rgba(T.l1, 0)); x.fillStyle = l; x.fillRect(0, 0, w, h);
    });
  }
  function cornice(x, w, h) {   // il filo d'oro coi cantonali (gran galà)
    var g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#fff3b8"); g.addColorStop(0.3, "#f2c230"); g.addColorStop(0.6, "#a8761a"); g.addColorStop(1, "#f7d871");
    x.save(); x.strokeStyle = g; x.globalAlpha = 0.75; x.lineWidth = 1.2; x.beginPath(); x.roundRect ? x.roundRect(8, 8, w - 16, h - 16, 6) : x.rect(8, 8, w - 16, h - 16); x.stroke();
    x.globalAlpha = 1; x.fillStyle = g; [[8, 8, 1, 1], [w - 8, 8, -1, 1], [8, h - 8, 1, -1], [w - 8, h - 8, -1, -1]].forEach(function (c) { x.beginPath(); x.moveTo(c[0] - 2 * c[2], c[1] - 2 * c[3]); x.lineTo(c[0] + 11 * c[2], c[1] - 2 * c[3]); x.lineTo(c[0] - 2 * c[2], c[1] + 11 * c[3]); x.closePath(); x.fill(); });
    x.restore();
  }
  function bordi(x, w, h) {   // l'ombra della rilegatura a sinistra e l'angolo scuro
    var g = x.createLinearGradient(0, 0, w * 0.08, 0); g.addColorStop(0, "rgba(0,0,0,.45)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w * 0.08, h);
    var v = x.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.45, w / 2, h * 0.45, Math.max(w, h) * 0.8); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.38)"); x.fillStyle = v; x.fillRect(0, 0, w, h);
  }

  // ---- LA PAGINA DI UNA SQUADRA ----
  // opz.top = dove finisce la testata (px), opz.pratoAlto = l'altezza del prato (px)
  function pagina(cv, sq, pag, liv, opz) {
    opz = opz || {}; var P = prepara(cv), x = P.x, w = P.w, h = P.h, T = tinte(sq), r = rnd("pag|" + sq + "|" + pag);
    var alto = opz.pratoAlto || (liv === "A" ? 14 : Math.max(26, h * 0.06)), base = h - alto, top = opz.top || h * 0.25, ricco = pag === 1;
    fondoNotte(x, w, h, T, ricco && liv !== "A");
    if (liv !== "A") trama(x, sq, w, h, ricco ? 0.075 : 0.06, T, P.dpr);
    righeCampo(x, w, h, pag, top, base, liv === "A" ? 0.06 : 0.075);
    if (liv !== "A") pallone(x, pag === 1 ? w * 0.92 : w * 0.06, pag === 1 ? h * 0.5 : h * 0.34, w * 0.26, 0.07);
    if (liv !== "A") riflettori(x, w, h, T, ricco ? 1 : 0.6);
    if (liv === "C") torri(x, w, h, base, T);
    var hb = base - (liv === "C" ? Math.round(w * 0.06) : 0), alone = x.createLinearGradient(0, hb - w * (ricco ? 0.42 : 0.22), 0, hb);   // (il chiarore dietro la città: le sagome scure si staccano)
    alone.addColorStop(0, rgba(T.l1, 0)); alone.addColorStop(1, rgba(T.l1, liv === "A" ? 0.14 : (ricco ? 0.3 : 0.16))); x.fillStyle = alone; x.fillRect(0, hb - w * 0.42, w, w * 0.42);
    var k = liv === "A" ? 0.75 : (ricco ? 1 : 0.6), tb = liv === "C" ? Math.round(w * 0.06) : 0;
    if (opz.citta) cittaFoto(x, opz.citta, w, h, base - tb, T, P.dpr, ricco);
    else disegnaCitta(x, sq, w, base - tb, k, T, { dpr: P.dpr, alfaFar: liv === "A" ? 0.45 : (ricco ? 0.75 : 0.5), soloFar: liv !== "A" && !ricco, finestre: liv !== "A", mare: liv === "A" ? false : true });
    if (liv === "C") tribuna(x, w, base - tb, tb, T, r);
    prato(x, w, h, alto, liv, r);
    if (liv === "C") cornice(x, w, h);
    bordi(x, w, h);
    return cv;
  }
  // il retro della pagina che gira: la stessa notte, più scura, senza città
  function retro(cv, sq) { var P = prepara(cv), x = P.x, T = tinte(sq); fondoNotte(x, P.w, P.h, T, false); x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(0, 0, P.w, P.h); righeCampo(x, P.w, P.h, 1, P.h * 0.2, P.h * 0.9, 0.05); return cv; }

  // ---- LA COPERTINA: lo stadio di notte ----
  // luce: null = tutto il disegno di base (riflettori spenti); 0..3 = solo il bagliore di quel riflettore (tela a parte); "campo" = il prato acceso
  function geoStadio(w, h) { return { orizz: h * 0.56, torri: [[w * 0.08, h * 0.3], [w * 0.3, h * 0.25], [w * 0.7, h * 0.25], [w * 0.92, h * 0.3]] }; }
  function copertina(cv, liv, luce) {
    var P = prepara(cv), x = P.x, w = P.w, h = P.h, G = geoStadio(w, h), r = rnd("cop|" + liv), T = { l1: "#4f7dff", c1: "#e0225a", c2: "#ffc247" };
    if (luce === "campo") {   // il prato che brilla (si accende per ultimo)
      var y0 = G.orizz + h * 0.06, g = x.createRadialGradient(w / 2, y0 + (h - y0) * 0.35, 0, w / 2, y0 + (h - y0) * 0.35, w * 0.8);
      g.addColorStop(0, "rgba(170,255,180,.32)"); g.addColorStop(0.5, "rgba(120,230,140,.12)"); g.addColorStop(1, "rgba(120,230,140,0)"); x.fillStyle = g;
      x.beginPath(); x.moveTo(w * 0.22, y0); x.lineTo(w * 0.78, y0); x.lineTo(w * 1.25, h); x.lineTo(-w * 0.25, h); x.closePath(); x.fill();
      return cv;
    }
    if (typeof luce === "number") {   // un riflettore acceso: il pannello bianco, il bagliore e il fascio sul campo
      var t = G.torri[luce], fx = t[0], fy = t[1] - 22;
      var cone = x.createLinearGradient(fx, fy, w / 2, G.orizz + h * 0.2); cone.addColorStop(0, "rgba(255,250,225,.24)"); cone.addColorStop(1, "rgba(255,250,225,0)");
      x.fillStyle = cone; x.beginPath(); x.moveTo(fx - 10, fy); x.lineTo(fx + 10, fy); x.lineTo(w * 0.5 + (fx - w / 2) * 0.1 + w * 0.3, h * 0.95); x.lineTo(w * 0.5 + (fx - w / 2) * 0.1 - w * 0.3, h * 0.95); x.closePath(); x.fill();
      var gl = x.createRadialGradient(fx, fy, 0, fx, fy, w * 0.3); gl.addColorStop(0, "rgba(255,255,240,.95)"); gl.addColorStop(0.08, "rgba(255,248,220,.6)"); gl.addColorStop(0.35, "rgba(160,190,255,.16)"); gl.addColorStop(1, "rgba(160,190,255,0)"); x.fillStyle = gl; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 5; i++) for (var j = 0; j < 3; j++) { x.fillStyle = "#fffdf0"; x.fillRect(fx - 16 + i * 6.6, fy - 6 + j * 5, 5, 3.6); }
      return cv;
    }
    // il cielo e le stelle
    var cielo = x.createLinearGradient(0, 0, 0, G.orizz); cielo.addColorStop(0, "#05071a"); cielo.addColorStop(1, "#141a44"); x.fillStyle = cielo; x.fillRect(0, 0, w, h);
    for (var s = 0; s < 60; s++) { x.fillStyle = "rgba(255,255,255," + (0.2 + r() * 0.6).toFixed(2) + ")"; x.fillRect(r() * w, r() * G.orizz * 0.7, r() < 0.15 ? 1.6 : 1, r() < 0.15 ? 1.6 : 1); }
    var bag = x.createRadialGradient(w / 2, G.orizz, 0, w / 2, G.orizz, w * 0.8); bag.addColorStop(0, "rgba(224,34,90,.22)"); bag.addColorStop(1, "rgba(224,34,90,0)"); x.fillStyle = bag; x.fillRect(0, 0, w, h);
    // le tribune: una curva che sale, coi tifosi a puntini
    var tTop = G.orizz - h * 0.12, tBot = G.orizz + h * 0.07;
    x.fillStyle = "#0b0e26"; x.beginPath(); x.moveTo(0, tTop + h * 0.05); x.quadraticCurveTo(w / 2, tTop - h * 0.05, w, tTop + h * 0.05); x.lineTo(w, tBot); x.lineTo(0, tBot); x.closePath(); x.fill();
    var cols = ["#e0225a", "#ffc247", "#4fd8ff", "#ffffff", "#b39bff", "#3ee0a8"];
    for (var yy = tTop; yy < tBot - 3; yy += 3.6) { var curva = (1 - Math.pow((yy - tTop) / (tBot - tTop), 1)) * 0; for (var xx = r() * 3; xx < w; xx += 2.8 + r() * 1.4) { var lim = tTop + h * 0.05 - Math.sin(xx / w * Math.PI) * h * 0.1; if (yy < lim + curva) continue; x.fillStyle = rgba(cols[Math.floor(r() * cols.length)], (0.15 + r() * 0.3).toFixed(2)); x.fillRect(xx, yy, 1.6, 2); } }
    x.fillStyle = "#e0225a"; x.globalAlpha = 0.55; x.fillRect(0, tBot - 3, w, 3); x.globalAlpha = 1;
    // le torri dei riflettori (spente)
    G.torri.forEach(function (t) { x.fillStyle = "#070918"; x.fillRect(t[0] - 1.6, t[1] - 16, 3.2, tBot - t[1] + 16); x.fillStyle = "#1c2244"; x.fillRect(t[0] - 18, t[1] - 30, 36, 18); for (var i = 0; i < 5; i++) for (var j = 0; j < 3; j++) { x.fillStyle = "#3a4166"; x.fillRect(t[0] - 16 + i * 6.6, t[1] - 28 + j * 5, 5, 3.6); } });
    // il campo in prospettiva
    var y0 = tBot, n = 10;
    for (var i2 = 0; i2 < n; i2++) { var a = i2 / n, b = (i2 + 1) / n, ya = y0 + (h - y0) * Math.pow(a, 1.25), yb = y0 + (h - y0) * Math.pow(b, 1.25), xa = w * (0.22 - 0.47 * Math.pow(a, 1)), xb = w * (0.22 - 0.47 * Math.pow(b, 1)); x.fillStyle = i2 % 2 ? "#14512b" : "#186033"; x.beginPath(); x.moveTo(xa, ya); x.lineTo(w - xa, ya); x.lineTo(w - xb, yb); x.lineTo(xb, yb); x.closePath(); x.fill(); }
    x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(w * 0.23, y0 + 2); x.lineTo(w * 0.77, y0 + 2); x.lineTo(w * 1.24, h); x.moveTo(w * 0.23, y0 + 2); x.lineTo(-w * 0.24, h); x.stroke();
    var my = y0 + (h - y0) * 0.5; x.beginPath(); x.moveTo(w * 0.0, my); x.lineTo(w, my); x.stroke(); x.beginPath(); x.ellipse(w / 2, my, w * 0.2, (h - y0) * 0.11, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(w * 0.38, y0 + 2); x.lineTo(w * 0.36, y0 + (h - y0) * 0.12); x.lineTo(w * 0.64, y0 + (h - y0) * 0.12); x.lineTo(w * 0.62, y0 + 2); x.stroke();
    var sc = x.createLinearGradient(0, y0, 0, h); sc.addColorStop(0, "rgba(0,0,0,.25)"); sc.addColorStop(1, "rgba(0,0,0,.55)"); x.fillStyle = sc; x.fillRect(0, y0, w, h - y0);
    bordi(x, w, h);
    return cv;
  }
  copertina.torri = function (w, h) { return geoStadio(w, h).torri; };

  // ---- L'INDICE: il campo visto dall'alto ----
  function indice(cv, liv) {
    var P = prepara(cv), x = P.x, w = P.w, h = P.h, r = rnd("ind|" + liv), notte = liv === "A", bordo = liv === "C" ? 16 : 0;
    x.fillStyle = "#0b0e22"; x.fillRect(0, 0, w, h);
    if (bordo) {   // le tribune intorno (gran galà)
      var cols = ["#e0225a", "#ffc247", "#4fd8ff", "#ffffff", "#b39bff"];
      for (var yy = 0; yy < h; yy += 3.4) for (var xx = 0; xx < w; xx += 3.2) { if (xx > bordo && xx < w - bordo && yy > bordo && yy < h - bordo) continue; x.fillStyle = rgba(cols[Math.floor(r() * cols.length)], (0.12 + r() * 0.3).toFixed(2)); x.fillRect(xx, yy, 1.7, 2); }
    }
    var cx0 = bordo + 8, cy0 = bordo + 8, cw = w - 2 * cx0, ch = h - 2 * cy0, n = 14;
    for (var i = 0; i < n; i++) { x.fillStyle = notte ? (i % 2 ? "#0f2d1d" : "#123522") : (i % 2 ? "#17592e" : "#1b6635"); x.fillRect(cx0 - 8, cy0 - 8 + i * (ch + 16) / n, cw + 16, (ch + 16) / n + 0.5); }
    x.strokeStyle = notte ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.62)"; x.lineWidth = 1.5;
    x.strokeRect(cx0, cy0, cw, ch); x.beginPath(); x.moveTo(cx0, cy0 + ch / 2); x.lineTo(cx0 + cw, cy0 + ch / 2); x.stroke();
    x.beginPath(); x.arc(cx0 + cw / 2, cy0 + ch / 2, cw * 0.16, 0, Math.PI * 2); x.stroke();
    [[cy0, 1], [cy0 + ch, -1]].forEach(function (q) { var aw = cw * 0.56, ah = ch * 0.14, gw = cw * 0.26, gh = ch * 0.05; x.strokeRect(cx0 + (cw - aw) / 2, q[1] > 0 ? q[0] : q[0] - ah, aw, ah); x.strokeRect(cx0 + (cw - gw) / 2, q[1] > 0 ? q[0] : q[0] - gh, gw, gh); x.beginPath(); x.arc(cx0 + cw / 2, q[0] + q[1] * ah, cw * 0.1, q[1] > 0 ? 0.15 * Math.PI : 1.15 * Math.PI, q[1] > 0 ? 0.85 * Math.PI : 1.85 * Math.PI); x.stroke(); });
    [[cx0, cy0, 0], [cx0 + cw, cy0, 0.5], [cx0, cy0 + ch, 1.5], [cx0 + cw, cy0 + ch, 1]].forEach(function (c) { x.beginPath(); x.arc(c[0], c[1], 7, c[2] * Math.PI, (c[2] + 0.5) * Math.PI); x.stroke(); });
    if (!notte) {   // la luce dei riflettori sugli angoli e il prato che brilla al centro
      [[0, 0], [w, 0], [0, h], [w, h]].forEach(function (c) { var g = x.createRadialGradient(c[0], c[1], 0, c[0], c[1], w * 0.7); g.addColorStop(0, "rgba(255,250,225,.16)"); g.addColorStop(1, "rgba(255,250,225,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    }
    var v = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, notte ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.4)"); x.fillStyle = v; x.fillRect(0, 0, w, h);
    if (liv === "C") cornice(x, w, h);
    return cv;
  }
  // la doppia pagina col telefono girato (il dorso in mezzo)
  // le squadre che hanno la città in un file (carte/album/citta/<Squadra>.webp): si aggiunge qui il nome quando arriva il disegno
  var CITTA_FILE = [];
  window.L2S = { CITTA_FILE: CITTA_FILE, CARTELLA: "carte/album/citta/", pagina: pagina, retro: retro, copertina: copertina, indice: indice, tinte: tinte, rgba: rgba, mix: mix, luce: luce, CITTA: CITTA };
})();
