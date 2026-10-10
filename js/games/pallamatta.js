/* =========================================================
   SPeeD GAME — PALLA MATTA (stile Peggle)
   In alto c'è il cannone: trascini il dito per mirare (si vede la strada della pallina) e lasci per tirare.
   La pallina scende rimbalzando sui pioli: quelli toccati si accendono e, quando la pallina esce, scoppiano.
   Devi far scoppiare tutti i pioli ARANCIONI con 10 palline. Il secchio in fondo, se ci entri, ti ridà la pallina.
   - pioli: blu 10 punti, arancioni 100, viola 500 (cambia posto a ogni tiro), verdi = il potere del tuo aiutante;
   - più arancioni hai preso, più vale ogni piolo (x2, x3, x5, x10);
   - l'ultimo arancione: rallentatore, poi la FEBBRE MATTA con i secchi da 10.000 a 50.000 punti.
   Modi: da solo coi livelli (la sfida a turni con gli amici arriva dopo).
   La fisica e i livelli stanno in funzioni senza disegno (in fondo: window.__PM per le prove).
   ========================================================= */
(function () {
  "use strict";
  var ID = "pallamatta";

  // ---------- il tavolo (in unità: 100 di larghezza, 150 di altezza) e la fisica ----------
  var W = 100, H = 150, RB = 1.25, RP = 1.55, G = 58, V0 = 80, DT = 1 / 240;
  var E_PIOLO = 0.72, E_MURO = 0.82, VMAX = 120;
  var CX = 50, CY = 7;                       // il cannone
  var PALLINE = 10;
  var PUNTI = { blu: 10, arancio: 100, verde: 10, viola: 500 };
  var MOLT = [[0, 1], [0.4, 2], [0.6, 3], [0.76, 5], [0.88, 10]];   // quanto vale ogni piolo, secondo gli arancioni già presi
  var FEBBRE = [10000, 25000, 50000, 25000, 10000];                  // i secchi della febbre finale
  var EXTRA = [15000, 40000, 80000];                                 // punti in un tiro che regalano una pallina
  var SECCHIO = { y: 143.5, w: 15, h: 5 };
  var POTERI = {
    bomba: { icona: "💥", nome: "Bomba", sotto: "Il piolo verde esplode e accende tutto intorno" },
    multi: { icona: "⚽", nome: "Multipalla", sotto: "Dal piolo verde parte una seconda pallina" },
    mira:  { icona: "🎯", nome: "Mira lunga", sotto: "Per 3 tiri vedi tutta la strada della pallina" },
    fuoco: { icona: "🔥", nome: "Palla di fuoco", sotto: "La pallina passa attraverso i pioli e li accende" }
  };
  var ORDINE_POTERI = ["bomba", "multi", "mira", "fuoco"];

  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }

  // ---------- i livelli: disegni fatti di pioli ----------
  function riga(l, x0, y0, x1, y1, n) { for (var i = 0; i < n; i++) { var k = n === 1 ? 0.5 : i / (n - 1); l.push([x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]); } }
  function arco(l, cx, cy, r, a0, a1, n) { for (var i = 0; i < n; i++) { var a = a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1)); l.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }
  function cerchio(l, cx, cy, r, n) { for (var i = 0; i < n; i++) { var a = Math.PI * 2 * i / n - Math.PI / 2; l.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }
  function griglia(l, x0, y0, col, rig, dx, dy, sfalsa) { for (var j = 0; j < rig; j++) for (var i = 0; i < col - (sfalsa && j % 2 ? 1 : 0); i++) l.push([x0 + i * dx + (sfalsa && j % 2 ? dx / 2 : 0), y0 + j * dy]); }
  var PI = Math.PI;
  // (i pioli di una conca stanno larghi: la pallina deve poter passare, sennò resta incastrata)
  var LIVELLI = [
    { nome: "Il primo tiro", arancioni: 10, fa: function (l) { griglia(l, 14, 40, 9, 7, 9, 12, true); } },
    { nome: "Le onde", arancioni: 13, fa: function (l) { for (var j = 0; j < 5; j++) for (var i = 0; i < 13; i++) l.push([10 + i * 6.7, 46 + j * 18 + Math.sin(i * 0.9 + j) * 5]); } },
    { nome: "L'arcobaleno", fa: function (l) { [44, 36, 28, 20].forEach(function (r, i) { arco(l, 50, 112, r, PI * 1.08, PI * 1.92, 13 - i * 2); }); riga(l, 16, 125, 84, 125, 9); } },
    { nome: "Occhioni", fa: function (l) { cerchio(l, 30, 58, 13, 12); cerchio(l, 70, 58, 13, 12); cerchio(l, 30, 58, 5, 5); cerchio(l, 70, 58, 5, 5); arco(l, 50, 88, 30, PI * 0.15, PI * 0.85, 9); riga(l, 20, 128, 80, 128, 8); griglia(l, 18, 104, 8, 1, 9, 10, false); } },
    { nome: "La scala", fa: function (l) { for (var j = 0; j < 7; j++) { var x0 = j % 2 ? 46 : 12; riga(l, x0, 42 + j * 13, x0 + 42, 48 + j * 13, 7); } } },
    { nome: "Il cuore", fa: function (l) { for (var i = 0; i < 30; i++) { var t = PI * 2 * i / 30, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); l.push([50 + x * 2.3, 78 - y * 2.3]); } griglia(l, 36, 66, 4, 3, 9.5, 10, true); riga(l, 14, 128, 86, 128, 9); griglia(l, 8, 44, 2, 3, 84, 14, false); } },
    { nome: "La clessidra", fa: function (l) { riga(l, 14, 40, 46, 82, 8); riga(l, 86, 40, 54, 82, 8); riga(l, 46, 92, 14, 132, 8); riga(l, 54, 92, 86, 132, 8); riga(l, 24, 40, 76, 40, 7); riga(l, 24, 132, 76, 132, 7); cerchio(l, 50, 87, 5, 6); } },
    { nome: "Il diamante", fa: function (l) { for (var j = 0; j < 11; j++) { var n = j < 6 ? j + 1 : 11 - j; riga(l, 50 - (n - 1) * 4.4, 36 + j * 8.6, 50 + (n - 1) * 4.4, 36 + j * 8.6, n); } riga(l, 10, 60, 10, 120, 6); riga(l, 90, 60, 90, 120, 6); } },
    { nome: "I fiori", fa: function (l) { [[28, 56], [72, 56], [50, 84], [28, 112], [72, 112]].forEach(function (c) { cerchio(l, c[0], c[1], 9.5, 9); l.push([c[0], c[1]]); }); griglia(l, 12, 40, 5, 1, 19, 10, false); } },
    { nome: "La spirale", fa: function (l) { for (var i = 0; i < 64; i++) { var a = i * 0.36, r = 3 + i * 0.66; l.push([50 + Math.cos(a) * r, 82 + Math.sin(a) * r * 1.15]); } } },
    { nome: "La piramide", fa: function (l) { for (var j = 0; j < 10; j++) riga(l, 50 - j * 3.7, 40 + j * 9.4, 50 + j * 3.7, 40 + j * 9.4, j + 1); } },
    { nome: "Gran finale", fa: function (l) { cerchio(l, 50, 62, 22, 16); cerchio(l, 50, 62, 12, 9); griglia(l, 12, 96, 10, 4, 8.4, 10, true); arco(l, 50, 40, 36, PI * 0.1, PI * 0.9, 9); } }
  ];
  function creaLivello(i, scegliVerdi, hh) {   // hh: l'altezza del tavolo (sui telefoni lunghi è più alto: i pioli si allargano in giù)
    var l = []; LIVELLI[i].fa(l);
    var p = [];
    l.forEach(function (q) {   // dentro il tavolo e mai troppo vicini (la pallina deve passare)
      var x = Math.max(4, Math.min(W - 4, q[0])), y = Math.max(26, Math.min(136, q[1])); y = 26 + (y - 26) * ((hh || H) - 40) / 110;
      for (var k = 0; k < p.length; k++) if (Math.hypot(p[k].x - x, p[k].y - y) < RP * 2 + RB * 1.3) return;
      p.push({ x: x, y: y, tipo: "blu", acceso: false, via: false, n: p.length });
    });
    var r = rnd(7919 * (i + 1)), idx = p.map(function (_, k) { return k; });
    for (var k = idx.length - 1; k > 0; k--) { var j = Math.floor(r() * (k + 1)), tt = idx[k]; idx[k] = idx[j]; idx[j] = tt; }   // gli arancioni: sempre gli stessi per ogni livello
    var nA = LIVELLI[i].arancioni || Math.min(20, Math.max(8, Math.round(p.length * 0.25)));   // (i primi livelli ne hanno meno)
    for (k = 0; k < nA; k++) p[idx[k]].tipo = "arancio";
    if (scegliVerdi !== false) {   // i due verdi: a caso ogni volta
      var blu = p.filter(function (q) { return q.tipo === "blu"; });
      for (k = 0; k < 2 && blu.length; k++) { var c = Math.floor(Math.random() * blu.length); blu[c].tipo = "verde"; blu.splice(c, 1); }
    }
    return p;
  }

  // ---------- lo stato di una partita ----------
  function nuovoStato(lv, potere, hh) {
    var p = creaLivello(lv, true, hh);
    var st = { lv: lv, H: hh || H, pioli: p, palline: PALLINE, punti: 0, fase: "mira", ang: PI / 2, palle: [], potere: potere || "bomba",
      arTot: p.filter(function (q) { return q.tipo === "arancio"; }).length, arPresi: 0, viola: -1, t: 0, febbre: false, mira: 0,
      colpo: null, secchiPresi: 0, verdiPresi: 0, colpoMax: 0, extra: 0, fuoco: 0 };
    nuovoViola(st);
    return st;
  }
  function nuovoViola(st) {   // a ogni tiro un piolo blu diventa viola (quello di prima torna blu)
    st.pioli.forEach(function (q) { if (q.tipo === "viola" && !q.acceso) q.tipo = "blu"; });
    var blu = st.pioli.filter(function (q) { return q.tipo === "blu" && !q.via; });
    if (blu.length) blu[Math.floor(Math.random() * blu.length)].tipo = "viola";
  }
  function molt(st) { var f = st.arPresi / Math.max(1, st.arTot), m = 1; MOLT.forEach(function (x) { if (f >= x[0]) m = x[1]; }); return m; }
  function xSecchio(t) { return 50 + 37 * Math.sin(t * 0.65); }

  // un passo di fisica per una pallina: gravità, muri, pioli, secchio (eventi in ev: colpi, secchio, uscita)
  function passo(st, b, dt, ev) {
    b.vy += G * dt;
    var v = Math.hypot(b.vx, b.vy); if (v > VMAX) { b.vx *= VMAX / v; b.vy *= VMAX / v; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < RB) { b.x = RB; b.vx = Math.abs(b.vx) * E_MURO; ev.push({ t: "muro", b: b }); }
    if (b.x > W - RB) { b.x = W - RB; b.vx = -Math.abs(b.vx) * E_MURO; ev.push({ t: "muro", b: b }); }
    if (b.y < RB) { b.y = RB; b.vy = Math.abs(b.vy) * E_MURO; }
    var pp = st.pioli;
    for (var i = 0; i < pp.length; i++) {
      var q = pp[i]; if (q.via) continue;
      var dx = b.x - q.x, dy = b.y - q.y, d2 = dx * dx + dy * dy, rr = RB + RP;
      if (d2 >= rr * rr) continue;
      var d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d;
      if (!q.acceso) ev.push({ t: "piolo", q: q, b: b });
      if (b.fuoco) continue;   // la palla di fuoco passa attraverso
      b.x = q.x + nx * rr; b.y = q.y + ny * rr;
      var vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { b.vx -= (1 + E_PIOLO) * vn * nx; b.vy -= (1 + E_PIOLO) * vn * ny; b.vx *= 0.985; b.vy *= 0.985; b.vx += (((q.x * 7.31 + q.y * 3.17) % 1) - 0.5) * 1.2; }   // (una piccola deviazione, sempre la stessa per ogni piolo: niente rimbalzi su e giù all'infinito)
    }
    // in fondo: il secchio che si muove (o, nella febbre, i 5 secchi fissi)
    if (st.febbre) {
      [20, 40, 60, 80].forEach(function (px) { urtaPalo(b, px, st.H - 4.5, 1.3); });
      if (b.y > st.H - 3 && !b.preso) { b.preso = true; ev.push({ t: "febbre", b: b, slot: Math.max(0, Math.min(4, Math.floor(b.x / 20))) }); }
    } else {
      var sx = xSecchio(st.t), sy = st.H - 6.5, mw = SECCHIO.w / 2;
      urtaPalo(b, sx - mw, sy, 1.1); urtaPalo(b, sx + mw, sy, 1.1);
      if (!b.preso && b.vy > 0 && b.y > sy && b.y - b.vy * dt <= sy && Math.abs(b.x - sx) < mw - 0.6) { b.preso = true; ev.push({ t: "secchio", b: b }); }
    }
    if (b.y > st.H + 6) ev.push({ t: "fuori", b: b });
  }
  function urtaPalo(b, px, py, r) {
    var dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy), rr = r + RB;
    if (d >= rr || d === 0) return;
    var nx = dx / d, ny = dy / d; b.x = px + nx * rr; b.y = py + ny * rr;
    var vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.75 * vn * nx; b.vy -= 1.75 * vn * ny; }
  }
  // la strada della pallina per mirare: fino al primo piolo (o, con la Mira lunga, per un bel pezzo)
  function strada(st, ang, lunga, fuoco) {   // (fuoco: la pallina passerà attraverso i pioli, si vede tutta la parabola)
    var b = { x: CX + Math.cos(ang) * 6, y: CY + Math.sin(ang) * 6, vx: Math.cos(ang) * V0, vy: Math.sin(ang) * V0 }, pts = [], ev = [], urti = 0;
    if (fuoco) { b.fuoco = true; lunga = true; }
    var finto = { pioli: st.pioli.map(function (q) { return { x: q.x, y: q.y, via: q.via, acceso: true }; }), febbre: st.febbre, t: st.t, H: st.H };
    for (var i = 0; i < 240 * (lunga ? 2.6 : 1.4); i++) {
      ev.length = 0; var vx = b.vx, vy = b.vy;
      passo(finto, b, DT, ev);
      if (i % 6 === 0) pts.push([b.x, b.y]);
      if (Math.abs(b.vx - vx) > 8 || Math.abs(b.vy - vy) > 8 || (b.vy < 0 && vy > 0)) { urti++; if (!lunga) { pts.push([b.x, b.y]); break; } }
      if (b.y > st.H + 4) break;
    }
    return pts;
  }

  // ---------- suoni (fatti al volo) ----------
  var CHIAVE_SUONI = "sg-pm-suoni", NOTE = [0, 2, 4, 5, 7, 9, 11];
  function suoniOn() { try { return localStorage.getItem(CHIAVE_SUONI) !== "0"; } catch (e) { return true; } }
  function ac() { if (!suoniOn()) return null; try { return (window.SG && SG.audioCtx && SG.audioCtx()) || null; } catch (e) { return null; } }
  function tono(f, quando, dur, tipo, vol, fine) {
    var c = ac(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), a = c.currentTime + (quando || 0);
      o.type = tipo || "sine"; o.frequency.setValueAtTime(f, a); if (fine) o.frequency.exponentialRampToValueAtTime(fine, a + dur);
      g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(vol || 0.1, a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + dur);
      o.connect(g); g.connect(c.destination); o.start(a); o.stop(a + dur + 0.05);
    } catch (e) {}
  }
  function nota(n) { var ott = Math.floor(n / 7), g = NOTE[((n % 7) + 7) % 7]; return 392 * Math.pow(2, (ott * 12 + g) / 12); }   // dal sol in su
  function suonoPiolo(k, tipo) { var f = nota(Math.min(k, 20)); tono(f, 0, 0.16, "triangle", 0.09); tono(f * 2, 0, 0.08, "sine", 0.03); if (tipo === "arancio") tono(f * 1.5, 0.02, 0.12, "sine", 0.04); }
  function suonoScoppio(k) { tono(700 + k * 35, 0, 0.05, "square", 0.025); }
  function suonoTiro() { tono(180, 0, 0.12, "sine", 0.18, 60); tono(900, 0, 0.05, "triangle", 0.05, 400); }
  function suonoSecchio() { [0, 4, 7, 12].forEach(function (s, i) { tono(523 * Math.pow(2, s / 12), i * 0.07, 0.18, "triangle", 0.08); }); }
  function suonoPotere() { tono(300, 0, 0.35, "sawtooth", 0.05, 1200); tono(600, 0.1, 0.3, "triangle", 0.06, 1800); }
  function suonoBomba() { var c = ac(); if (!c) return; tono(120, 0, 0.5, "sawtooth", 0.12, 30); tono(70, 0, 0.6, "sine", 0.2, 25); }
  function suonoPerso() { [0, -1, -2, -5].forEach(function (s, i) { tono(330 * Math.pow(2, s / 12), i * 0.28, 0.32, "triangle", 0.08); }); }
  function rullo(dur) { for (var i = 0; i < dur * 22; i++) tono(90 + Math.random() * 30, i / 22, 0.05, "square", 0.02 + i / (dur * 22) * 0.03); }
  // l'Inno alla gioia (Beethoven, di tutti): la musica della febbre
  function innoGioia() {
    var m = [[4, 1], [4, 1], [5, 1], [6, 1], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [2, 1], [3, 1], [4, 1], [4, 1.5], [3, 0.5], [3, 2],
      [4, 1], [4, 1], [5, 1], [6, 1], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [2, 1], [3, 1], [4, 1], [3, 1.5], [2, 0.5], [2, 2]], t = 0, b = 0.27;
    var scala = [261.6, 293.7, 329.6, 349.2, 392, 440, 493.9];
    m.forEach(function (x) { var f = scala[x[0]]; tono(f * 2, t, x[1] * b * 0.95, "triangle", 0.09); tono(f, t, x[1] * b * 0.95, "sine", 0.05); t += x[1] * b; });
    [0, 4, 8, 12, 16, 20, 24, 28].forEach(function (k) { tono(130.8 * (k % 8 < 4 ? 1 : 1.5), k * b, b * 3.6, "sine", 0.05); });
  }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  // ---------- i progressi: livelli sbloccati, record e stelle (sul telefono e nel profilo) ----------
  var CHIAVE = "sg-pm-progressi";
  function profiloOk() { return !!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo()); }
  function progressi() {
    var p = {}; try { p = JSON.parse(localStorage.getItem(CHIAVE) || "{}") || {}; } catch (e) {}
    p.rec = p.rec || {}; p.stelle = p.stelle || {};
    if (profiloOk() && SGNube.statGioco) {   // dal profilo: quello che hai fatto su un altro telefono
      var s = SGNube.statGioco(ID) || {};
      LIVELLI.forEach(function (_, i) { var k = i + 1; if ((s["p" + k] || 0) > (p.rec[k] || 0)) p.rec[k] = s["p" + k]; if ((s["s" + k] || 0) > (p.stelle[k] || 0)) p.stelle[k] = s["s" + k]; });
    }
    return p;
  }
  function salvaProgressi(p) { try { localStorage.setItem(CHIAVE, JSON.stringify({ rec: p.rec, stelle: p.stelle, potere: p.potere })); } catch (e) {} }
  function sbloccato(p, i) { return i === 0 || (p.stelle[i] || 0) > 0; }

  // =========================================================
  //  LA SCHERMATA DEI LIVELLI (prima di giocare): scegli il livello e il tuo aiutante
  // =========================================================
  function schermataLivelli(t) {
    stile();
    var el = t.el, p = progressi(), s = t.schermata({ icona: "🔴", titolo: "Palla Matta", sotto: "Scegli il livello" });
    if (!POTERI[p.potere]) p.potere = "bomba";
    // l'aiutante, in piccolo: si cambia anche qui tra un livello e l'altro
    var nomePot = el("span", { class: "pm-pot-nome", text: POTERI[p.potere].nome }), riga = el("div", { class: "pm-aiutanti" }, [el("span", { class: "pm-aiu-et", text: "Aiutante:" })]);
    ORDINE_POTERI.forEach(function (k) {
      var b = el("button", { class: "pm-aiu" + (p.potere === k ? " attiva" : ""), text: POTERI[k].icona, "aria-label": POTERI[k].nome, onclick: function () {
        p.potere = k; salvaProgressi(p); [].forEach.call(riga.querySelectorAll(".pm-aiu"), function (x) { x.classList.remove("attiva"); }); b.classList.add("attiva"); nomePot.textContent = POTERI[k].nome; vibra(6);
      } });
      riga.appendChild(b);
    });
    riga.appendChild(nomePot);
    s._contenuto.appendChild(riga);
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Livelli" }));
    var lv = el("div", { class: "pm-livelli" });
    LIVELLI.forEach(function (L, i) {
      var ok = sbloccato(p, i), st = p.stelle[i + 1] || 0;
      lv.appendChild(el("button", { class: "pm-lv" + (ok ? "" : " chiuso") + (st ? " fatto" : ""), onclick: function () {
        if (!ok) return; vibra(8); partita(t, i, p.potere);
      } }, [
        el("b", { text: ok ? String(i + 1) : "🔒" }),
        el("span", { class: "pm-lv-nome", text: L.nome }),
        el("span", { class: "pm-lv-stelle", text: ok ? "★★★".slice(0, st) + "☆☆☆".slice(0, 3 - st) : "" }),
        el("small", { text: p.rec[i + 1] ? cifre(p.rec[i + 1]) : "" })
      ]));
    });
    s._contenuto.appendChild(lv);
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "‹ Esci", onclick: function () { t.esci(); } }));
    t.mostra(s);
  }

  // =========================================================
  //  LA PARTITA (un livello): il tavolo a tutto schermo
  // =========================================================
  function partita(t, lv, potere) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("pm-piena");
    var st = nuovoStato(lv, potere), io = (t.nomeProfilo && t.nomeProfilo()) || (t.giocatori && t.giocatori[0]) || "Tu";
    var ui = { mira: null, zoom: 1, zx: CX, zy: 70, lento: 1, salto: 0, fx: [], scritte: [], coriandoli: [], pulizia: null, lento0: false, dito: false, tAvviso: 0 };
    var faccia = null;   // il tuo avatar (busto) per il disegno accanto al cannone
    try { var cfgF = t.mioOmino ? t.mioOmino(io) : null; if (cfgF && window.SGOmino) { faccia = new Image(); faccia.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfgF, { busto: true })); } } catch (e) {}
    var scena = el("div", { class: "pm-scena" }), cv = el("canvas", { class: "pm-tavolo" }), ctx = cv.getContext("2d");
    // in alto: esci, suoni, punti, palline; sotto la barra degli arancioni col moltiplicatore
    var bEsci = el("button", { class: "pm-tasto", text: "‹", "aria-label": "Esci", onclick: function () { esci(); } });
    var bAudio = el("button", { class: "pm-tasto", text: suoniOn() ? "🔊" : "🔇", onclick: function () { var on = !suoniOn(); try { localStorage.setItem(CHIAVE_SUONI, on ? "1" : "0"); } catch (e) {} bAudio.textContent = on ? "🔊" : "🔇"; } });
    var hPunti = el("div", { class: "pm-punti", text: "0" }), hPalle = el("div", { class: "pm-palle" }), hPot = el("div", { class: "pm-pot", text: POTERI[st.potere].icona });
    var barra = el("div", { class: "pm-barra" }), fill = el("i", { class: "pm-fill" }), hAr = el("span", { class: "pm-ar" }), hMolt = el("span", { class: "pm-molt", text: "x1" });
    barra.appendChild(fill); [0.4, 0.6, 0.76, 0.88].forEach(function (f, i) { var tk = el("i", { class: "pm-tacca", text: ["x2", "x3", "x5", "x10"][i] }); tk.style.left = (f * 100) + "%"; barra.appendChild(tk); });
    var testa = el("div", { class: "pm-testa" }, [bEsci, bAudio, el("div", { class: "pm-centro" }, [hPunti, el("div", { class: "pm-riga" }, [hAr, barra, hMolt])]), hPot, hPalle]);
    var avviso = el("div", { class: "pm-avviso" }), sopra = el("div", { class: "pm-sopra" });
    [cv, testa, avviso, sopra].forEach(function (n) { scena.appendChild(n); });
    s._contenuto.appendChild(scena);
    t.mostra(s);
    function vivo() { return document.body.contains(cv); }
    (function () {   // sui telefoni lunghi il tavolo si allunga in giù (fino a un certo punto): niente spazio vuoto
      var w0 = scena.clientWidth || 360, h0 = scena.clientHeight || 640, top0 = testa.offsetHeight + 6, s0 = (w0 - 8) / W;
      var hh = Math.max(H, Math.min(205, (h0 - top0 - 6) / s0));
      if (hh > H + 0.5) st = nuovoStato(lv, potere, hh);
    })();

    // ---- misure: il tavolo più grande possibile sotto la testa ----
    var S = 3, ox = 0, oy = 0, cw = 360, ch = 640, dpr = 1, sprite = {}, sfondo = null;
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      cw = scena.clientWidth || 360; ch = scena.clientHeight || 640; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      var top = testa.offsetHeight + 6;
      S = Math.min((cw - 8) / W, (ch - top - 6) / st.H); ox = (cw - S * W) / 2; oy = top + (ch - top - 6 - S * st.H) / 2;
      sprite = {}; sfondo = null;
    }
    window.addEventListener("resize", misura);

    // ---- i disegni pronti (pioli e sfondo), rifatti solo se cambia la misura ----
    var COL = { blu: ["#74c0fc", "#1c7ed6", "#0b3f80"], arancio: ["#ffc078", "#f76707", "#8a3200"], verde: ["#b2f2bb", "#2f9e44", "#11481e"], viola: ["#e5dbff", "#9c36b5", "#4a1561"] };
    function spritePiolo(tipo, acceso) {
      var k = tipo + (acceso ? "1" : "0"); if (sprite[k]) return sprite[k];
      var r = RP * S * dpr, m = Math.ceil(r * (acceso ? 2.4 : 1.25)), c = document.createElement("canvas"); c.width = c.height = m * 2;
      var x = c.getContext("2d"), col = COL[tipo];
      if (acceso) { var al = x.createRadialGradient(m, m, r * 0.5, m, m, m); al.addColorStop(0, col[0]); al.addColorStop(1, "rgba(255,255,255,0)"); x.globalAlpha = 0.75; x.fillStyle = al; x.fillRect(0, 0, m * 2, m * 2); x.globalAlpha = 1; }
      var gr = x.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r);
      gr.addColorStop(0, acceso ? "#ffffff" : col[0]); gr.addColorStop(0.55, acceso ? col[0] : col[1]); gr.addColorStop(1, col[acceso ? 1 : 2]);
      x.beginPath(); x.arc(m, m, r, 0, PI * 2); x.fillStyle = gr; x.fill();
      x.lineWidth = Math.max(1, r * 0.14); x.strokeStyle = acceso ? "#ffffff" : "rgba(0,0,0,.35)"; x.stroke();
      x.beginPath(); x.ellipse(m - r * 0.3, m - r * 0.38, r * 0.34, r * 0.22, -0.5, 0, PI * 2); x.fillStyle = "rgba(255,255,255,.65)"; x.fill();
      sprite[k] = c; return c;
    }
    function disegnaSfondo() {
      var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; var x = c.getContext("2d");
      x.scale(dpr, dpr);
      var g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, "#1a1440"); g.addColorStop(0.6, "#2b1f63"); g.addColorStop(1, "#3c2a7a"); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
      for (var i = 0; i < 70; i++) { var r2 = rnd(31 + i * 7); x.fillStyle = "rgba(255,255,255," + (0.15 + r2() * 0.5).toFixed(2) + ")"; x.beginPath(); x.arc(r2() * cw, r2() * ch, r2() * 1.4 + 0.3, 0, PI * 2); x.fill(); }
      // il tavolo: una lastra un po' più chiara coi bordi
      x.save(); x.translate(ox, oy);
      var tg = x.createLinearGradient(0, 0, 0, st.H * S); tg.addColorStop(0, "rgba(120,100,220,.18)"); tg.addColorStop(1, "rgba(80,60,180,.32)");
      x.fillStyle = tg; arrot(x, 0, 0, W * S, st.H * S, 14); x.fill();
      x.lineWidth = 3; x.strokeStyle = "rgba(190,170,255,.45)"; arrot(x, 0, 0, W * S, st.H * S, 14); x.stroke();
      x.restore();
      sfondo = c;
    }
    function arrot(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

    // ---- il dito: trascina per mirare, lascia per tirare ----
    function alTavolo(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - ox) / S, y: (e.clientY - r.top - oy) / S }; }
    function mira(e) {
      var p = alTavolo(e), a = Math.atan2(p.y - CY, p.x - CX);
      if (p.y < CY + 1) a = p.x < CX ? PI - 0.06 : 0.06;
      st.ang = Math.max(0.06, Math.min(PI - 0.06, a));
    }
    // il dito: tenendo premuto (o trascinando) si mira e lasciando la pallina NON parte;
    // un tocco veloce, senza muovere il dito, fa partire la pallina dove avevi mirato
    cv.addEventListener("pointerdown", function (e) {
      if (st.fase !== "mira") return;
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      try { if (window.SG && SG.audioCtx) SG.audioCtx(); } catch (er2) {}
      clearTimeout(ui.tTieni);
      ui.dito = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), mira: false };
      var d0 = ui.dito; ui.tTieni = setTimeout(function () { if (ui.dito === d0 && st.fase === "mira") { d0.mira = true; mira(e); } }, 200);   // tenuto premuto: si mira lì
    });
    cv.addEventListener("pointermove", function (e) {
      var d = ui.dito; if (!d || d.id !== e.pointerId || st.fase !== "mira") return;
      if (!d.mira && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 7) d.mira = true;
      if (d.mira) mira(e);
    });
    function lascia(e) {
      var d = ui.dito; if (!d || d.id !== e.pointerId) return; ui.dito = null; clearTimeout(ui.tTieni);
      if (e.type === "pointerup" && st.fase === "mira" && !d.mira && performance.now() - d.t < 260) tira();   // il tocco veloce: tira
    }
    cv.addEventListener("pointerup", lascia); cv.addEventListener("pointercancel", lascia);

    function tira() {
      if (st.palline <= 0) return;
      st.palline--; st.fase = "volo";
      st.colpo = { punti: 0, colpiti: [], nota: 0, extra: 0, verde: false, t0: st.t };
      var b = { x: CX + Math.cos(st.ang) * 6, y: CY + Math.sin(st.ang) * 6, vx: Math.cos(st.ang) * V0, vy: Math.sin(st.ang) * V0, scia: [], fermo: { x: CX, y: CY, t: 0 } };
      st.palle = [b];
      if (st.mira > 0) st.mira--;
      if (st.fuoco > 0) { st.fuoco--; b.fuoco = Infinity; dimmi("🔥 Palla di fuoco!"); }   // il potere caricato: tutto il tiro attraverso i pioli
      suonoTiro(); vibra(10); aggTesta();
    }

    // ---- un evento della fisica: piolo, secchio, febbre, uscita ----
    function evento(e) {
      if (e.t === "piolo") {
        var q = e.q; if (q.acceso) return;
        q.acceso = true; st.colpo.colpiti.push(q);
        if (q.tipo === "arancio") { st.arPresi++; }
        var pts = PUNTI[q.tipo] * molt(st); st.colpo.punti += pts; st.punti += pts;
        scritta(q.x, q.y - 3, "+" + cifre(pts), q.tipo);
        suonoPiolo(st.colpo.nota++, q.tipo);
        if (q.tipo === "verde") attivaPotere(q, e.b);
        controllaExtra();
        if (q.tipo === "arancio" && st.arPresi >= st.arTot && !st.febbre) febbre(e.b);
        aggTesta();
      } else if (e.t === "secchio") {
        st.palline++; st.secchiPresi++; suonoSecchio(); ui.salto = 1.2; vibra([20, 30, 20]); dimmi("Pallina gratis! 🪣"); aggTesta();
        e.b.esce = true;
      } else if (e.t === "febbre") {
        var v = FEBBRE[e.slot]; st.punti += v; st.colpo.punti += v; scritta(e.slot * 20 + 10, st.H - 10, "+" + cifre(v), "febbre"); e.b.esce = true;
        [0, 4, 7, 12, 16].forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * 0.06, 0.25, "triangle", 0.09); });
        fuochi(e.slot * 20 + 10, st.H - 15, 40); aggTesta();
      } else if (e.t === "fuori") e.b.esce = true;
    }
    function controllaExtra() {   // tanti punti in un tiro: una pallina in più
      while (st.colpo.extra < EXTRA.length && st.colpo.punti >= EXTRA[st.colpo.extra]) { st.colpo.extra++; st.palline++; dimmi("Pallina in più! " + cifre(EXTRA[st.colpo.extra - 1]) + " punti in un tiro 🎉"); suonoSecchio(); }
    }
    function attivaPotere(q, b) {   // il piolo verde: il potere dell'aiutante
      st.verdiPresi++; suonoPotere(); vibra(25);
      var P = POTERI[st.potere]; dimmi(P.icona + " " + P.nome + (st.potere === "fuoco" ? ": pronta per il prossimo tiro!" : st.potere === "mira" ? " per i prossimi 3 tiri!" : "!"));
      if (st.potere === "bomba") {
        suonoBomba(); ui.fx.push({ t: "onda", x: q.x, y: q.y, r: 0, vita: 0.5 });
        st.pioli.forEach(function (o) { if (!o.via && !o.acceso && Math.hypot(o.x - q.x, o.y - q.y) < 15) evento({ t: "piolo", q: o, b: b }); });
        var dx = b.x - q.x, dy = b.y - q.y, d = Math.hypot(dx, dy) || 1; b.vx += dx / d * 25; b.vy += dy / d * 25 - 10;
      } else if (st.potere === "multi") {
        st.palle.push({ x: q.x, y: q.y - RP - RB - 0.2, vx: -b.vx * 0.8 + (Math.random() - 0.5) * 20, vy: -Math.abs(b.vy) * 0.6 - 15, scia: [], fermo: { x: q.x, y: q.y, t: st.t } });
      } else if (st.potere === "mira") { st.mira += 3; }
      else if (st.potere === "fuoco") { st.fuoco = (st.fuoco || 0) + 1; }   // come in Peggle: la palla di fuoco parte al tiro dopo
    }
    function febbre(b) {   // l'ultimo arancione!
      st.febbre = true; ui.lento = 0.22; ui.tLento = 1.1; ui.zoomA = { x: b.x, y: b.y };
      rullo(0.9); vibra([40, 40, 80]);
      setTimeout(function () { if (!vivo()) return; innoGioia(); dimmi("FEBBRE MATTA! 🎉"); fuochi(50, 70, 60); }, 950);
    }

    // ---- le scritte che salgono, gli scoppi e i coriandoli ----
    function scritta(x, y, txt, tipo) { ui.scritte.push({ x: x, y: y, txt: txt, tipo: tipo, vita: 1 }); if (ui.scritte.length > 30) ui.scritte.shift(); }
    function scintille(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * PI * 2, v = 8 + Math.random() * 18; ui.fx.push({ t: "sc", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, col: col, vita: 0.5 + Math.random() * 0.3 }); } }
    function fuochi(x, y, n) { var cols = ["#ffd43b", "#ff6b6b", "#74c0fc", "#b197fc", "#8ce99a", "#ffa94d"]; for (var i = 0; i < n; i++) { var a = Math.random() * PI * 2, v = 15 + Math.random() * 35; ui.fx.push({ t: "sc", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, col: cols[i % cols.length], vita: 0.9 + Math.random() * 0.6 }); } }
    function dimmi(txt) { avviso.textContent = txt; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }

    // ---- la testa: punti, palline, arancioni, moltiplicatore ----
    function aggTesta() {
      hPunti.textContent = cifre(st.punti);
      hPalle.textContent = "⚪ " + st.palline;
      var rim = st.arTot - st.arPresi; hAr.textContent = "🟠 " + rim;
      fill.style.transform = "scaleX(" + (st.arPresi / Math.max(1, st.arTot)).toFixed(3) + ")";
      var m = molt(st); if (hMolt.textContent !== "x" + m) { hMolt.textContent = "x" + m; hMolt.classList.remove("su"); void hMolt.offsetWidth; hMolt.classList.add("su"); }
      hPot.textContent = POTERI[st.potere].icona + (st.mira > 0 ? " " + st.mira : "") + (st.fuoco > 0 ? " " + st.fuoco : "");   // quanti tiri col potere carico
    }

    // ---- il giro: fisica a passi fissi, poi il disegno ----
    var ult = performance.now(), anim = 0, acc = 0;
    function giro(ora) {
      if (!vivo()) return;
      var dt = Math.min(0.05, (ora - ult) / 1000); ult = ora;
      aggiorna(dt); disegna();
      anim = requestAnimationFrame(giro);
    }
    function aggiorna(dt) {
      // il rallentatore della febbre: poi torna normale
      if (ui.tLento > 0) { ui.tLento -= dt; if (ui.tLento <= 0) ui.lento = 1; }
      var dts = dt * (ui.lento || 1);
      st.t += dts;
      if (st.fase === "volo") {
        acc += dts; var ev = [];
        while (acc >= DT) {
          acc -= DT;
          st.palle.forEach(function (b) {
            if (b.esce) return;
            if (b.fuoco && st.t > b.fuoco) b.fuoco = 0;
            passo(st, b, DT, ev);
          });
          ev.forEach(evento); ev.length = 0;
        }
        st.palle.forEach(function (b) {
          b.scia.push([b.x, b.y]); if (b.scia.length > 14) b.scia.shift();
          // la pallina incastrata: dopo un po' scoppiano i pioli accesi lì vicino (o una spintarella)
          if (Math.hypot(b.x - b.fermo.x, b.y - b.fermo.y) > 3) { b.fermo = { x: b.x, y: b.y, t: st.t }; }
          else if (st.t - b.fermo.t > 2.2) {
            var vicini = st.pioli.filter(function (q) { return q.acceso && !q.via && Math.hypot(q.x - b.x, q.y - b.y) < 7; });
            if (vicini.length) vicini.forEach(function (q) { q.via = true; scintille(q.x, q.y, COL[q.tipo][0], 6); }); else { b.vx += (Math.random() - 0.5) * 30; b.vy -= 20; }
            b.fermo = { x: b.x, y: b.y, t: st.t };
          }
        });
        st.palle = st.palle.filter(function (b) { return !b.esce; });
        if (!st.palle.length) finisceTiro();
      }
      if (st.fase === "pulizia") {   // i pioli accesi scoppiano uno dopo l'altro
        ui.pulizia.t -= dt;
        while (ui.pulizia.t <= 0 && ui.pulizia.lista.length) {
          var q = ui.pulizia.lista.shift(); if (!q.via) { q.via = true; scintille(q.x, q.y, COL[q.tipo][0], 7); suonoScoppio(ui.pulizia.k++); }
          ui.pulizia.t += Math.max(0.025, 0.07 - ui.pulizia.k * 0.002);
        }
        if (!ui.pulizia.lista.length && ui.pulizia.t <= -0.25) dopoPulizia();
      }
      if (ui.salto > 0) ui.salto -= dt;
      // gli effetti
      ui.fx.forEach(function (f) { f.vita -= dt; if (f.t === "sc") { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 40 * dt; } else if (f.t === "onda") f.r += 60 * dt; });
      ui.fx = ui.fx.filter(function (f) { return f.vita > 0; });
      ui.scritte.forEach(function (w) { w.vita -= dt * 0.8; w.y -= dt * 8; });
      ui.scritte = ui.scritte.filter(function (w) { return w.vita > 0; });
      // la telecamera: si avvicina alla pallina nel rallentatore della febbre
      var vuoleZoom = ui.lento < 1 && st.palle[0];
      var zt = vuoleZoom ? 1.7 : 1; ui.zoom += (zt - ui.zoom) * Math.min(1, dt * 5);
      if (vuoleZoom) { ui.zx += (st.palle[0].x - ui.zx) * Math.min(1, dt * 6); ui.zy += (st.palle[0].y - ui.zy) * Math.min(1, dt * 6); }
    }
    function finisceTiro() {
      st.fase = "pulizia"; st.colpoMax = Math.max(st.colpoMax, st.colpo.punti);
      var lista = st.colpo.colpiti.filter(function (q) { return !q.via; });
      if (st.febbre) lista = st.pioli.filter(function (q) { return q.acceso && !q.via; });
      ui.pulizia = { lista: lista, t: 0.15, k: 0 };
      if (st.colpo.punti > 0 && !st.febbre) scritta(50, st.H - 18, "Tiro: " + cifre(st.colpo.punti), "tiro");
    }
    function dopoPulizia() {
      if (st.febbre) return vinto();
      if (st.palline <= 0) return perso();
      st.fase = "mira"; nuovoViola(st); aggTesta();
    }

    // ---- il disegno ----
    function disegna() {
      if (!sfondo) { if (!cw) misura(); disegnaSfondo(); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sfondo, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      if (ui.zoom > 1.01) {   // lo zoom della febbre, intorno alla pallina
        var px = ox + ui.zx * S, py = oy + ui.zy * S;
        ctx.translate(cw / 2, ch / 2); ctx.scale(ui.zoom, ui.zoom); ctx.translate(-px, -py);
      }
      if (st.febbre) {   // l'arcobaleno della febbre
        var cols = ["#ff6b6b", "#ffa94d", "#ffd43b", "#8ce99a", "#74c0fc", "#b197fc"];
        ctx.globalAlpha = 0.16; for (var i = 0; i < 6; i++) { ctx.fillStyle = cols[i]; ctx.fillRect(ox, oy + ((i * 25 + st.t * 30) % (H + 25) - 25) * S, W * S, 25 * S * 0.5); } ctx.globalAlpha = 1;
      }
      // i pioli
      st.pioli.forEach(function (q) {
        if (q.via) return;
        var sp = spritePiolo(q.tipo, q.acceso), m = sp.width / dpr / 2;
        ctx.drawImage(sp, ox + q.x * S - m, oy + q.y * S - m, m * 2, m * 2);
      });
      // in fondo: il secchio, o i secchi della febbre
      if (st.febbre) {
        for (var k = 0; k < 5; k++) {
          var xx = ox + k * 20 * S, gy = oy + (st.H - 9) * S;
          ctx.fillStyle = k === 2 ? "rgba(255,212,59,.45)" : "rgba(255,255,255,.18)"; ctx.fillRect(xx + 2, gy, 20 * S - 4, 9 * S);
          ctx.fillStyle = "#fff"; ctx.font = "900 " + Math.round(3.1 * S) + "px system-ui,sans-serif"; ctx.textAlign = "center";
          ctx.fillText(cifre(FEBBRE[k] / 1000) + "k", xx + 10 * S, gy + 6.2 * S);
        }
        [20, 40, 60, 80].forEach(function (px2) { ctx.beginPath(); ctx.arc(ox + px2 * S, oy + (st.H - 4.5) * S, 1.3 * S, 0, PI * 2); ctx.fillStyle = "#e9ecef"; ctx.fill(); });
      } else {
        var sx = xSecchio(st.t), sw = SECCHIO.w * S, sh = SECCHIO.h * S, bx = ox + sx * S - sw / 2, by = oy + (st.H - 6.5) * S;
        var gb = ctx.createLinearGradient(bx, by, bx, by + sh); gb.addColorStop(0, "#ffd43b"); gb.addColorStop(1, "#e67700");
        ctx.fillStyle = gb; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + sw, by); ctx.lineTo(bx + sw - 4, by + sh); ctx.lineTo(bx + 4, by + sh); ctx.closePath(); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = "#7a3e00"; ctx.stroke();
        ctx.fillStyle = "#fff3bf"; ctx.fillRect(bx, by - 1.5, sw, 3);
      }
      // la strada per mirare
      if (st.fase === "mira") {
        var pts = strada(st, st.ang, st.mira > 0, st.fuoco > 0);
        ctx.fillStyle = st.fuoco > 0 ? "rgba(255,146,43,.95)" : st.mira > 0 ? "rgba(140,233,154,.9)" : "rgba(255,255,255,.75)";
        pts.forEach(function (p2, i) { if (i % 2) return; ctx.beginPath(); ctx.arc(ox + p2[0] * S, oy + p2[1] * S, Math.max(1.2, 0.45 * S * (1 - i / pts.length * 0.5)), 0, PI * 2); ctx.fill(); });
      }
      // le palline con la scia
      st.palle.forEach(function (b) {
        b.scia.forEach(function (p3, i) { ctx.globalAlpha = (i / b.scia.length) * 0.35; ctx.fillStyle = b.fuoco ? "#ff922b" : "#e9ecef"; ctx.beginPath(); ctx.arc(ox + p3[0] * S, oy + p3[1] * S, RB * S * (0.4 + i / b.scia.length * 0.5), 0, PI * 2); ctx.fill(); });
        ctx.globalAlpha = 1;
        var gx = ox + b.x * S, gy2 = oy + b.y * S, gp = ctx.createRadialGradient(gx - RB * S * 0.4, gy2 - RB * S * 0.4, 1, gx, gy2, RB * S);
        gp.addColorStop(0, "#ffffff"); gp.addColorStop(1, b.fuoco ? "#ff6b00" : "#adb5bd");
        ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(gx, gy2, RB * S, 0, PI * 2); ctx.fill();
      });
      // il tuo avatar accanto al cannone: salta col secchio e nella febbre
      if (faccia && faccia.complete && faccia.naturalWidth) {
        var fz = 11 * S, sal = (st.febbre || ui.salto > 0) ? Math.abs(Math.sin(st.t * 9)) * 2.2 * S : 0;
        ctx.drawImage(faccia, ox + (CX - 15) * S - fz / 2, oy + 0.6 * S - sal, fz, fz * 1.02);
      }
      // il cannone
      var cx2 = ox + CX * S, cy2 = oy + CY * S;
      ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(st.ang - PI / 2);
      var gc = ctx.createLinearGradient(-2 * S, 0, 2 * S, 0); gc.addColorStop(0, "#495057"); gc.addColorStop(0.5, "#ced4da"); gc.addColorStop(1, "#343a40");
      ctx.fillStyle = gc; arrot(ctx, -2.1 * S, -1 * S, 4.2 * S, 8.5 * S, 1.5 * S); ctx.fill(); ctx.strokeStyle = "#212529"; ctx.lineWidth = 1.5; ctx.stroke();
      if (st.fase === "mira" && st.palline > 0) { ctx.beginPath(); ctx.arc(0, 6 * S, RB * S, 0, PI * 2); ctx.fillStyle = "#f1f3f5"; ctx.fill(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx2, cy2, 4.4 * S, 0, PI * 2); var gk = ctx.createRadialGradient(cx2 - S, cy2 - S, 1, cx2, cy2, 4.4 * S); gk.addColorStop(0, "#ffd43b"); gk.addColorStop(1, "#c92a2a"); ctx.fillStyle = gk; ctx.fill(); ctx.strokeStyle = "#5c0f0f"; ctx.lineWidth = 2; ctx.stroke();
      // gli effetti
      ui.fx.forEach(function (f) {
        if (f.t === "sc") { ctx.globalAlpha = Math.min(1, f.vita * 2); ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(ox + f.x * S, oy + f.y * S, 0.55 * S, 0, PI * 2); ctx.fill(); }
        else if (f.t === "onda") { ctx.globalAlpha = Math.max(0, f.vita * 2); ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ox + f.x * S, oy + f.y * S, f.r * S, 0, PI * 2); ctx.stroke(); }
      });
      ctx.globalAlpha = 1;
      ui.scritte.forEach(function (w) {
        ctx.globalAlpha = Math.min(1, w.vita * 1.6);
        var big = w.tipo === "tiro" || w.tipo === "febbre";
        ctx.font = "900 " + Math.round((big ? 4.6 : w.tipo === "arancio" || w.tipo === "viola" ? 3.2 : 2.6) * S) + "px system-ui,sans-serif"; ctx.textAlign = "center";
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(20,10,50,.85)"; ctx.strokeText(w.txt, ox + w.x * S, oy + w.y * S);
        ctx.fillStyle = w.tipo === "arancio" ? "#ffc078" : w.tipo === "viola" ? "#e5dbff" : w.tipo === "verde" ? "#b2f2bb" : big ? "#ffe066" : "#d0ebff";
        ctx.fillText(w.txt, ox + w.x * S, oy + w.y * S);
      });
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // ---- fine del livello ----
    function salva(vinto, stelle) {
      var p = progressi(), k = lv + 1, nuovoRec = st.punti > (p.rec[k] || 0);
      if (vinto) { if (nuovoRec) p.rec[k] = st.punti; if (stelle > (p.stelle[k] || 0)) p.stelle[k] = stelle; }
      salvaProgressi(p);
      if (profiloOk() && SGNube.salvaProgressi) {   // nel profilo: per i trofei e per ritrovare i livelli su un altro telefono
        var incr = [["partite", 1], ["arancioni", st.arPresi], ["secchi", st.secchiPresi], ["verdi", st.verdiPresi]];
        if (vinto) { incr.push(["livelliFiniti", 1]); incr.push(["febbri", 1]); if (st.palline >= PALLINE) incr.push(["senzaPerdere", 1]); }
        var rec = [["colpoMax", st.colpoMax], ["puntiMax", st.punti]];
        if (vinto) { rec.push(["livelloMax", k]); rec.push(["p" + k, st.punti]); rec.push(["s" + k, stelle]); }
        try { SGNube.salvaProgressi(null, ID, incr.filter(function (x) { return x[1]; }), rec); } catch (e) {}
      }
      if (t.risultato) t.risultato([{ nome: io, pos: vinto ? 1 : 2, punti: st.punti }]);   // XP e statistiche (record del punteggio)
      return nuovoRec;
    }
    function vinto() {
      st.fase = "fine";
      var bonus = st.palline * 10000, totale0 = st.punti; st.punti += bonus;
      var stelle = st.palline >= 5 ? 3 : st.palline >= 3 ? 2 : 1;
      var nuovoRec = salva(true, stelle);
      [0, 4, 7, 12].forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * 0.12, 0.3, "triangle", 0.1); });
      fuochi(30, 60, 40); fuochi(70, 60, 40);
      finestra("Livello superato! 🎉", [
        ["Punti del livello", cifre(totale0)], ["Palline rimaste: " + st.palline + " × 10.000", "+" + cifre(bonus)], ["Totale", cifre(st.punti)]
      ], "★★★".slice(0, stelle) + "☆☆☆".slice(0, 3 - stelle), nuovoRec, true);
    }
    function perso() {
      st.fase = "fine"; salva(false, 0); suonoPerso();
      var rim = st.arTot - st.arPresi;
      finestra("Palline finite!", [["Arancioni rimasti", String(rim)], ["Punti", cifre(st.punti)]], rim <= 3 ? "Per un pelo! Riprova 💪" : "Riprova, ce la fai!", false, false);
    }
    function finestra(titolo, righe, stelle, nuovoRec, vinto) {
      while (sopra.firstChild) sopra.removeChild(sopra.firstChild);
      var box = el("div", { class: "pm-fine" }, [el("h2", { text: titolo }), el("div", { class: "pm-stelle" + (vinto ? "" : " msg"), text: stelle })]);
      righe.forEach(function (r) { box.appendChild(el("div", { class: "pm-rig" }, [el("span", { text: r[0] }), el("b", { text: r[1] })])); });
      if (nuovoRec) box.appendChild(el("div", { class: "pm-rec", text: "🏅 Nuovo record del livello!" }));
      var tasti = el("div", { class: "pm-tasti" });
      if (vinto && lv + 1 < LIVELLI.length) tasti.appendChild(el("button", { class: "btn btn-primario", text: "▶ Livello " + (lv + 2), onclick: function () { chiudi(); partita(t, lv + 1, st.potere); } }));
      tasti.appendChild(el("button", { class: "btn " + (vinto ? "btn-fantasma" : "btn-primario"), text: "↻ " + (vinto ? "Rigioca" : "Riprova"), onclick: function () { chiudi(); partita(t, lv, st.potere); } }));
      tasti.appendChild(el("button", { class: "btn btn-fantasma", text: "☰ Livelli", onclick: function () { chiudi(); schermataLivelli(t); } }));
      box.appendChild(tasti);
      sopra.appendChild(box); sopra.classList.add("su");
    }
    function chiudi() { cancelAnimationFrame(anim); window.removeEventListener("resize", misura); }
    function esci() {   // a livello cominciato chiede prima (un tocco sbagliato non butta la partita)
      if (st.fase === "fine" || (st.palline >= PALLINE && st.fase === "mira")) { chiudi(); return schermataLivelli(t); }
      while (sopra.firstChild) sopra.removeChild(sopra.firstChild);
      sopra.appendChild(el("div", { class: "pm-fine" }, [el("h2", { text: "Lasciare il livello?" }), el("div", { class: "pm-stelle msg", text: "I punti di questa partita si perdono." }),
        el("div", { class: "pm-tasti" }, [
          el("button", { class: "btn btn-primario", text: "▶ Continua a giocare", onclick: function () { sopra.classList.remove("su"); } }),
          el("button", { class: "btn btn-fantasma", text: "☰ Torna ai livelli", onclick: function () { chiudi(); schermataLivelli(t); } }) ])]));
      sopra.classList.add("su");
    }

    misura(); aggTesta();
    window.__PMpartita = { st: function () { return st; }, evento: evento, tira: tira, mira: function (a) { st.ang = a; }, avanza: function (sec) { for (var i = 0; i < sec * 60; i++) aggiorna(1 / 60); } };   // (per le prove)
    dimmi("Livello " + (lv + 1) + ": " + LIVELLI[lv].nome + " · prendi tutti i 🟠");
    if (lv < 2) setTimeout(function () { if (vivo() && st.fase === "mira") dimmi("Tieni premuto per mirare · tocca per tirare"); }, 2500);
    anim = requestAnimationFrame(function (o) { ult = o; giro(o); });
  }

  // ---------- lo stile (una volta sola, col prefisso pm-) ----------
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.pm-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#1a1440}",
      ".schermata.pm-piena>.testa,.schermata.pm-piena>.piede{display:none}",
      ".schermata.pm-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".pm-scena{position:relative;height:var(--alt,100dvh);overflow:hidden;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}",
      ".pm-tavolo{position:absolute;inset:0;width:100%;height:100%;touch-action:none}",
      ".pm-testa{position:absolute;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:3;display:flex;align-items:center;gap:6px;pointer-events:none}",
      ".pm-testa>*{pointer-events:auto}",
      ".pm-tasto{flex:none;width:36px;height:36px;border:0;border-radius:12px;padding:0;cursor:pointer;font:inherit;font-size:1.2rem;font-weight:900;line-height:1;color:#fff;background:rgba(255,255,255,.14)}",
      ".pm-centro{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none}",
      ".pm-punti{font-weight:900;font-size:1.35rem;line-height:1;color:#ffe066;text-shadow:0 2px 0 rgba(0,0,0,.4)}",
      ".pm-riga{display:flex;align-items:center;gap:6px;width:100%;max-width:260px}",
      ".pm-ar{flex:none;font-weight:900;font-size:.78rem;color:#ffc078}",
      ".pm-barra{position:relative;flex:1;height:10px;border-radius:999px;background:rgba(255,255,255,.14);overflow:visible}",
      ".pm-fill{position:absolute;inset:0;border-radius:999px;background:linear-gradient(90deg,#ffa94d,#f76707);transform-origin:0 50%;transform:scaleX(0);transition:transform .25s}",
      ".pm-tacca{position:absolute;top:-1px;bottom:-1px;width:2px;margin-left:-1px;background:rgba(255,255,255,.55);font-style:normal;font-size:0}",
      ".pm-molt{flex:none;min-width:2.2em;text-align:center;font-weight:900;font-size:.85rem;padding:1px 6px;border-radius:999px;color:#1a1440;background:#ffe066}",
      ".pm-molt.su{animation:pmPop .5s cubic-bezier(.3,1.6,.5,1)}",
      "@keyframes pmPop{0%{transform:scale(1)}40%{transform:scale(1.5)}100%{transform:scale(1)}}",
      ".pm-pot{flex:none;height:32px;padding:0 8px;border-radius:12px;display:flex;align-items:center;font-weight:900;font-size:.95rem;color:#fff;background:rgba(140,233,154,.18);box-shadow:inset 0 0 0 1.5px rgba(140,233,154,.5)}",
      ".pm-palle{flex:none;height:32px;padding:0 9px;border-radius:12px;display:flex;align-items:center;font-weight:900;font-size:.95rem;color:#fff;background:rgba(255,255,255,.14)}",
      ".pm-avviso{position:absolute;left:50%;top:calc(76px + env(safe-area-inset-top));z-index:4;transform:translateX(-50%);padding:8px 14px;border-radius:999px;white-space:nowrap;font-weight:900;font-size:.9rem;color:#1a1440;background:#ffe066;box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;pointer-events:none}",
      ".pm-avviso.su{animation:pmAvviso 2.2s ease forwards}",
      "@keyframes pmAvviso{0%{opacity:0;transform:translate(-50%,-8px) scale(.9)}12%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0}}",
      ".pm-sopra{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,6,30,.55);opacity:0;pointer-events:none;transition:opacity .3s}",
      ".pm-sopra.su{opacity:1;pointer-events:auto}",
      ".pm-fine{width:100%;max-width:340px;padding:18px 16px;border-radius:22px;text-align:center;color:#fff;background:linear-gradient(180deg,#3b2a86,#22195a);box-shadow:0 12px 40px rgba(0,0,0,.5),inset 0 0 0 2px rgba(190,170,255,.35);animation:pmEntra .45s cubic-bezier(.3,1.4,.5,1)}",
      "@keyframes pmEntra{from{transform:scale(.6);opacity:0}}",
      ".pm-fine h2{margin:0 0 6px;font-size:1.4rem}",
      ".pm-stelle{font-size:2.2rem;color:#ffd43b;letter-spacing:.1em;margin-bottom:8px}",
      ".pm-stelle.msg{font-size:1rem;color:#d0bfff;letter-spacing:0}",
      ".pm-rig{display:flex;justify-content:space-between;gap:10px;padding:5px 2px;border-bottom:1px solid rgba(255,255,255,.1);font-size:.9rem}",
      ".pm-rig b{color:#ffe066}",
      ".pm-rec{margin-top:8px;font-weight:900;color:#8ce99a}",
      ".pm-tasti{display:flex;flex-direction:column;gap:8px;margin-top:14px}",
      // la schermata dei livelli
      ".pm-aiutanti{display:flex;align-items:center;gap:6px;margin:4px 0 12px;flex-wrap:wrap}",
      ".pm-aiu-et{font-weight:800;font-size:.85rem;color:var(--testo-tenue)}",
      ".pm-aiu{width:40px;height:40px;border:0;border-radius:50%;cursor:pointer;font-size:1.25rem;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12)}",
      ".pm-aiu.attiva{background:rgba(255,212,59,.25);box-shadow:inset 0 0 0 2.5px #ffd43b}",
      ".pm-pot-nome{font-weight:900;font-size:.9rem;color:#ffe066}",
      ".pm-livelli{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}",
      ".pm-lv{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px 8px;border:0;border-radius:16px;cursor:pointer;font:inherit;color:#fff;background:linear-gradient(180deg,#4c3ba8,#2d2275);box-shadow:var(--ombra)}",
      ".pm-lv b{font-size:1.4rem;line-height:1.1}",
      ".pm-lv-nome{font-size:.7rem;font-weight:800;line-height:1.15;min-height:2.3em;display:flex;align-items:center;text-align:center}",
      ".pm-lv-stelle{font-size:.9rem;color:#ffd43b;letter-spacing:.05em}",
      ".pm-lv small{font-size:.66rem;color:#d0bfff;min-height:1em}",
      ".pm-lv.chiuso{opacity:.45;cursor:default}",
      ".pm-lv.fatto{box-shadow:var(--ombra),inset 0 0 0 2px rgba(255,212,59,.55)}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Palla Matta", icona: "🔴",
    descrizione: "Spara la pallina dall'alto e falla rimbalzare sui pioli: fai scoppiare tutti gli arancioni con 10 palline. Livelli, poteri e la febbre finale!",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 2,
    modi: [{ modo: "solo", icona: "🎯", nome: "Da solo", sotto: "I livelli, uno dopo l'altro" }],
    regole: [
      "Tieni premuto (o trascina) per <b>mirare</b>: i puntini mostrano dove va la pallina. Lasciando il dito non parte niente: dai un <b>tocco veloce</b> per tirare.",
      "La pallina rimbalza sui pioli e li <b>accende</b>; quando esce, i pioli accesi scoppiano.",
      "Fai scoppiare tutti i pioli <b>arancioni</b> con <b>10 palline</b>. Più arancioni prendi, più vale ogni piolo: <b>x2, x3, x5, x10</b>.",
      "Il piolo <b>viola</b> vale 500 punti e cambia posto a ogni tiro. I pioli <b>verdi</b> attivano il potere del tuo <b>aiutante</b> (bomba, multipalla, mira lunga o palla di fuoco).",
      "Se la pallina entra nel <b>secchio</b> che si muove in fondo, la riprendi. Tanti punti in un tiro regalano palline.",
      "Con l'ultimo arancione parte la <b>Febbre Matta</b>: in fondo ci sono i secchi da 10.000, 25.000 e 50.000 punti. Ogni pallina avanzata vale 10.000 punti."
    ],
    impostazioni: function (box, dove, aiuti) {   // prima di cominciare: il tuo aiutante (lo ritrovi anche nei livelli)
      var el = aiuti.el, p = progressi(); dove.modo = aiuti.modo || "solo";
      if (!POTERI[p.potere]) p.potere = "bomba";
      box.appendChild(el("div", { class: "etichetta", text: "Il tuo aiutante: il potere dei pioli verdi" }));
      var g = el("div", { class: "modo-griglia", style: "grid-template-columns:1fr" });
      ORDINE_POTERI.forEach(function (k) {
        var P = POTERI[k], b = el("button", { class: "modo-chip" + (p.potere === k ? " attiva" : ""), onclick: function () {
          p.potere = k; salvaProgressi(p); [].forEach.call(g.children, function (x) { x.className = "modo-chip"; }); b.className = "modo-chip attiva"; vibra(6);
        } }, [el("div", { class: "mt", text: P.icona + " " + P.nome }), el("div", { class: "ms", text: P.sotto })]);
        g.appendChild(b);
      });
      box.appendChild(g);
    },
    avvia: function (t) { schermataLivelli(t); }
  });

  // per le prove: la fisica e i livelli, senza disegno
  window.__PM = { LIVELLI: LIVELLI, creaLivello: creaLivello, nuovoStato: nuovoStato, passo: passo, strada: strada, molt: molt, W: W, H: H, DT: DT, V0: V0, CX: CX, CY: CY };
})();
