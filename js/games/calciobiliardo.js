/* =========================================================
   CALCIO BILIARDO — il calcio coi dischi, come il biliardo
   Ognuno ha 5 calciatori (dischi). A turno se ne tira uno: lo tocchi,
   tiri indietro il dito come una fionda e lasci. I dischi colpiscono la
   palla e gli altri dischi e rimbalzano sui bordi: fai gol nella porta
   avversaria. Vince chi arriva per primo ai gol scelti.
   Modi: contro il computer (Matt), in due sullo stesso telefono (uno per
   lato, il telefono in mezzo), online (ognuno dal suo: l'host decide il
   tiro vero, gli altri lo rivedono uguale e poi si allineano alla sua foto).
   La fisica sta in funzioni a parte (passo/simula): la usa anche Matt,
   che prova tanti tiri "per finta" e sceglie il migliore.
   ========================================================= */
(function () {
  "use strict";

  var ID = "calciobiliardo";
  var MIN = 2, MAX = 2;          // online: in due

  // ---------- il campo (misure in "larghezze di campo") ----------
  var W = 1, L = 1.55, PORTA = 0.34, FONDO = 0.07;
  var PL = (W - PORTA) / 2, PR = (W + PORTA) / 2;              // i pali
  var R = 0.05, RP = 0.031, MD = 1, MP = 0.45;                 // raggio e peso: calciatori e palla
  var DT = 1 / 240, VMAX = 3.1, TIRA = 0.22;                   // TIRA = quanto si tira indietro il dito per la forza piena
  var ATT_D = Math.exp(-1.35 * DT), ATT_P = Math.exp(-1.05 * DT), DEC = 0.45 * DT;   // attrito dell'erba
  var E_URTO = 0.9, E_MURO = 0.75;
  var MAX_SEC = 8;                                             // un tiro dura al massimo 8 secondi
  var TEMPO = 30;                                              // online: secondi per tirare
  var GIALLO = "#ffcc1f", BLU = "#2f7dff", NOTTE = "#0d1533";   // le due squadre: gialli (sotto) e blu (sopra)
  function colore(q) { return q === 0 ? GIALLO : BLU; }
  // formazione: [x, distanza dalla PROPRIA linea di fondo]; l'ultimo è l'attaccante (si mette a centrocampo)
  var FORM = [[0.5, 0.075], [0.2, 0.36], [0.5, 0.42], [0.8, 0.36], [0.5, 0]];

  function fmtN(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function r4(v) { return Math.round(v * 10000) / 10000; }

  // =========================================================
  //  FISICA (pura: niente disegno). Corpo 0 = palla, 1-5 gialli (sotto), 6-10 blu (sopra)
  // =========================================================
  function nuovoStato(batte) {   // batte = la squadra che dà il calcio d'inizio (il suo attaccante sta vicino alla palla)
    var s = { x: [W / 2], y: [L / 2], vx: [0], vy: [0] };
    for (var q = 0; q < 2; q++) for (var k = 0; k < 5; k++) {
      var f = FORM[k], d = k === 4 ? L / 2 - (q === batte ? 0.1 : 0.21) : f[1];
      s.x.push(q === 0 ? f[0] : W - f[0]); s.y.push(q === 0 ? L - d : d); s.vx.push(0); s.vy.push(0);
    }
    return s;
  }
  function copia(s) { return { x: s.x.slice(), y: s.y.slice(), vx: s.vx.slice(), vy: s.vy.slice() }; }
  function daFoto(f) { var n = f.x.length, z = []; for (var i = 0; i < n; i++) z.push(0); return { x: f.x.slice(), y: f.y.slice(), vx: z.slice(), vy: z.slice() }; }
  function rag(i) { return i === 0 ? RP : R; }
  function mas(i) { return i === 0 ? MP : MD; }
  function squadraDi(i) { return i === 0 ? -1 : (i <= 5 ? 0 : 1); }
  function fermo(s) { for (var i = 0; i < 11; i++) if (s.vx[i] || s.vy[i]) return false; return true; }
  function ferma(s) { for (var i = 0; i < 11; i++) { s.vx[i] = 0; s.vy[i] = 0; } }
  function palo(s, px, py, ev) {   // i pali: la palla ci rimbalza come su un punto
    var dx = s.x[0] - px, dy = s.y[0] - py, d2 = dx * dx + dy * dy;
    if (d2 >= RP * RP || d2 === 0) return;
    var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, vn = s.vx[0] * nx + s.vy[0] * ny;
    s.x[0] = px + nx * RP; s.y[0] = py + ny * RP;
    if (vn < 0) { s.vx[0] -= (1 + E_MURO) * vn * nx; s.vy[0] -= (1 + E_MURO) * vn * ny; if (ev) ev.muro = Math.max(ev.muro, -vn); }
  }
  function muri(s, i, ev) {
    var r = rag(i), x = s.x[i], y = s.y[i], v;
    if (i === 0 && (y < 0 || y > L)) {   // la palla dentro una porta: la rete ai lati e in fondo
      if (x < PL + r) { s.x[0] = PL + r; s.vx[0] = Math.abs(s.vx[0]) * 0.4; }
      if (x > PR - r) { s.x[0] = PR - r; s.vx[0] = -Math.abs(s.vx[0]) * 0.4; }
      if (y < -FONDO + r) { s.y[0] = -FONDO + r; s.vy[0] = Math.abs(s.vy[0]) * 0.25; }
      if (y > L + FONDO - r) { s.y[0] = L + FONDO - r; s.vy[0] = -Math.abs(s.vy[0]) * 0.25; }
      return;
    }
    if (x < r) { v = -s.vx[i]; s.x[i] = r; if (v > 0) { s.vx[i] = v * E_MURO; if (ev) ev.muro = Math.max(ev.muro, v); } }
    if (x > W - r) { v = s.vx[i]; s.x[i] = W - r; if (v > 0) { s.vx[i] = -v * E_MURO; if (ev) ev.muro = Math.max(ev.muro, v); } }
    var bocca = i === 0 && x > PL && x < PR;   // davanti alla porta passa solo la palla
    if (y < r && !bocca) { v = -s.vy[i]; s.y[i] = r; if (v > 0) { s.vy[i] = v * E_MURO; if (ev) ev.muro = Math.max(ev.muro, v); } }
    if (y > L - r && !bocca) { v = s.vy[i]; s.y[i] = L - r; if (v > 0) { s.vy[i] = -v * E_MURO; if (ev) ev.muro = Math.max(ev.muro, v); } }
    if (i === 0) { palo(s, PL, 0, ev); palo(s, PR, 0, ev); palo(s, PL, L, ev); palo(s, PR, L, ev); }
  }
  function urto(s, i, j, ev) {
    var dx = s.x[j] - s.x[i], dy = s.y[j] - s.y[i], rr = rag(i) + rag(j), d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr) return;
    var d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d, mi = mas(i), mj = mas(j), mt = mi + mj, sov = rr - d;
    s.x[i] -= nx * sov * mj / mt; s.y[i] -= ny * sov * mj / mt; s.x[j] += nx * sov * mi / mt; s.y[j] += ny * sov * mi / mt;
    var rv = (s.vx[j] - s.vx[i]) * nx + (s.vy[j] - s.vy[i]) * ny;
    if (rv >= 0) return;
    var J = -(1 + E_URTO) * rv / (1 / mi + 1 / mj);
    s.vx[i] -= J * nx / mi; s.vy[i] -= J * ny / mi; s.vx[j] += J * nx / mj; s.vy[j] += J * ny / mj;
    if (ev) ev.urto = Math.max(ev.urto, -rv);
  }
  // un passo di fisica; ritorna la squadra che ha segnato (0 = gialli nella porta in alto, 1 = blu in quella in basso) o -1
  function passo(s, ev) {
    var i, j;
    for (i = 0; i < 11; i++) {
      var vx = s.vx[i], vy = s.vy[i];
      if (!vx && !vy) continue;
      var a = i === 0 ? ATT_P : ATT_D; vx *= a; vy *= a;
      var v = Math.sqrt(vx * vx + vy * vy);
      if (v <= DEC) { vx = 0; vy = 0; } else { var k = (v - DEC) / v; vx *= k; vy *= k; }
      s.vx[i] = vx; s.vy[i] = vy; s.x[i] += vx * DT; s.y[i] += vy * DT;
    }
    for (i = 0; i < 11; i++) muri(s, i, ev);
    for (i = 0; i < 11; i++) for (j = i + 1; j < 11; j++) urto(s, i, j, ev);
    for (i = 0; i < 11; i++) muri(s, i, null);
    if (s.y[0] < -RP) return 0;
    if (s.y[0] > L + RP) return 1;
    return -1;
  }
  function simula(s, sec) {   // fa andare il tiro fino alla fine (per Matt e per le prove)
    var n = Math.round((sec || MAX_SEC) / DT);
    for (var k = 0; k < n; k++) { var g = passo(s, null); if (g >= 0) return g; if (fermo(s)) return -1; }
    ferma(s); return -1;
  }

  // =========================================================
  //  MATT: prova tanti tiri per finta e sceglie quello che gli conviene
  // =========================================================
  function valuta(t, gol, q, prima) {
    if (gol === q) return 100000;
    if (gol === 1 - q) return -100000;
    var v = (q === 1 ? t.y[0] : L - t.y[0]) * 100;                      // palla lontana dalla mia porta
    var miaPorta = q === 1 ? 0 : L;
    if (Math.hypot(t.x[0] - W / 2, t.y[0] - miaPorta) < 0.4) v -= 250;  // pericolo sotto la mia porta
    if (Math.hypot(t.x[0] - prima.x[0], t.y[0] - prima.y[0]) < 0.01) v -= 150;   // non ho toccato la palla
    var gk = q === 0 ? 1 : 6;
    v -= Math.abs(t.y[gk] - (q === 0 ? L - 0.075 : 0.075)) * 60;         // il portiere resta in porta
    return v;
  }
  function sceltaBot(s, q, liv) {
    var gy = q === 1 ? L + 0.05 : -0.05, cand = [];
    var bersagli = liv === "facile" ? [W / 2] : [W / 2, PL + 0.06, PR - 0.06];
    var forze = liv === "facile" ? [0.75] : (liv === "medio" ? [0.6, 0.9] : [0.5, 0.75, 1]);
    for (var i = 1; i <= 10; i++) {
      if (squadraDi(i) !== q) continue;
      bersagli.forEach(function (tx) {
        var dx = tx - s.x[0], dy = gy - s.y[0], d = Math.hypot(dx, dy) || 1;
        var gx = s.x[0] - dx / d * (R + RP), gyy = s.y[0] - dy / d * (R + RP);   // "palla fantasma": dove colpirla per mandarla in porta
        var a = Math.atan2(gyy - s.y[i], gx - s.x[i]);
        forze.forEach(function (p) {
          cand.push({ i: i, a: a, p: p });
          if (liv === "difficile") { cand.push({ i: i, a: a + 0.035, p: p }); cand.push({ i: i, a: a - 0.035, p: p }); }
        });
      });
      cand.push({ i: i, a: Math.atan2(s.y[0] - s.y[i], s.x[0] - s.x[i]), p: 1 });   // dritto sulla palla, per spazzarla via
    }
    function prova(i, a, p) { var t = copia(s); t.vx[i] = Math.cos(a) * VMAX * p; t.vy[i] = Math.sin(a) * VMAX * p; return valuta(t, simula(t, 6), q, s); }
    cand.forEach(function (c) { c.v = prova(c.i, c.a, c.p); });
    var rum = { facile: 0.16, medio: 0.06, difficile: 0.015 }[liv] || 0.06;
    // i tiri migliori si riprovano con un po' di errore di mira: se sbagliando di poco
    // finirebbero in autogol, valgono quanto il caso peggiore (così Matt è prudente)
    cand.sort(function (a, b) { return b.v - a.v; });
    var best = cand[0], bv = -Infinity;
    cand.slice(0, 6).forEach(function (c) {
      var v = Math.min(c.v, prova(c.i, c.a + rum, c.p), prova(c.i, c.a - rum, c.p));
      if (v > bv) { bv = v; best = c; }
    });
    return { i: best.i, a: best.a + (Math.random() * 2 - 1) * rum, p: Math.max(0.3, Math.min(1, best.p + (Math.random() * 2 - 1) * rum)) };
  }

  // =========================================================
  //  SUONI (corti) e vibrazione (solo quando prendi un calciatore)
  // =========================================================
  var ultimoSuono = 0;
  function suono(tipo, forza) {
    var ctx = window.SG && SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t0 = ctx.currentTime;
      if (tipo === "gol") {
        [523, 659, 784, 1046].forEach(function (f, k) {
          var o = ctx.createOscillator(), g = ctx.createGain(), tt = t0 + k * 0.1;
          o.type = "triangle"; o.frequency.setValueAtTime(f, tt);
          g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.22, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.22);
          o.connect(g); g.connect(ctx.destination); o.start(tt); o.stop(tt + 0.25);
        });
        return;
      }
      var adesso = Date.now(); if (adesso - ultimoSuono < 45) return; ultimoSuono = adesso;
      var o2 = ctx.createOscillator(), g2 = ctx.createGain(), f0 = tipo === "muro" ? 260 : 620 + forza * 520;
      o2.type = tipo === "muro" ? "sine" : "triangle";
      o2.frequency.setValueAtTime(f0, t0); o2.frequency.exponentialRampToValueAtTime(f0 * 0.45, t0 + 0.07);
      g2.gain.setValueAtTime(0.0001, t0); g2.gain.exponentialRampToValueAtTime(Math.min(0.26, 0.04 + forza * 0.22), t0 + 0.005); g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
      o2.connect(g2); g2.connect(ctx.destination); o2.start(t0); o2.stop(t0 + 0.12);
    } catch (e) {}
  }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  // =========================================================
  //  LO SCHERMO DI GIOCO (uguale per tutti i modi): campo su tela, il resto a pezzi
  //  o = { flip: la mia squadra è la blu (la giro in basso), ruota: in due sullo stesso telefono,
  //        nomi: [gialli, blu], omini: [gialli, blu] }
  //  cb = { onTiro(i, vx, vy), onEsci() }
  // =========================================================
  function creaSchermo(t, cb, o) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("cb-piena");
    var ui = { t: t, cb: cb, o: o, st: null, anim: null, mira: null, turno: 0, fase: "mira", puoi: false, mie: [], golVisto: null, scadenza: null, testo: { giu: "", su: "" } };
    var scena = el("div", { class: "cb-scena" });
    ui.cv = el("canvas", { class: "cb-campo" }); ui.ctx = ui.cv.getContext("2d");
    var esci = el("button", { class: "cb-esci", "aria-label": "Esci", text: "‹", onclick: function () { cb.onEsci(); } });
    // la targhetta di ognuno, vicino alla sua porta: avatar piccolo, nome, "tocca a te" e i suoi gol
    function targa(cls, q) {
      var av = el("div", { class: "cb-av" }), msg = el("div", { class: "cb-msg" }), gol = el("div", { class: "cb-golnum", text: "0" });
      var box = el("div", { class: "cb-targa " + cls }, [av, el("div", { class: "cb-testi" }, [el("div", { class: "cb-nome", text: (o.nomi && o.nomi[q]) || "" }), msg]), gol]);
      box.style.setProperty("--sq", colore(q));
      var cfg = o.omini && o.omini[q];
      if (cfg && window.SGOmino) av.innerHTML = SGOmino.svg(cfg, { busto: true });
      return { box: box, msg: msg, gol: gol };
    }
    var qGiu = o.flip ? 1 : 0;
    ui.giu = targa("giu", qGiu); ui.su = targa("su" + (o.ruota ? " ruota" : ""), 1 - qGiu);
    ui.golTxt = el("div", { class: "cb-gol" });
    [ui.cv, ui.su.box, ui.giu.box, esci, ui.golTxt].forEach(function (n) { scena.appendChild(n); });
    s._contenuto.appendChild(scena);
    t.mostra(s);

    function vivo() { return document.body.contains(ui.cv); }
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      var cw = scena.clientWidth || 360, ch = scena.clientHeight || 640, dpr = Math.min(2, window.devicePixelRatio || 1);
      ui.cv.width = Math.round(cw * dpr); ui.cv.height = Math.round(ch * dpr); ui.cw = cw; ui.ch = ch; ui.dpr = dpr;
      ui.S = Math.min((cw - 20) / W, (ch - 2 * 62) / (L + 2 * FONDO));   // il campo più grande possibile: restano solo le targhette
      ui.ox = (cw - ui.S * W) / 2; ui.oy = (ch - ui.S * L) / 2;
      sfondo(ui); disegna(ui);
    }
    window.addEventListener("resize", misura);
    misura();

    // dal dito al campo (anche col campo girato)
    function alCampo(e) {
      var r = ui.cv.getBoundingClientRect(), x = (e.clientX - r.left - ui.ox) / ui.S, y = (e.clientY - r.top - ui.oy) / ui.S;
      return o.flip ? { x: W - x, y: L - y } : { x: x, y: y };
    }
    ui.cv.addEventListener("pointerdown", function (e) {
      if (!ui.puoi || ui.anim || !ui.st) return;
      var p = alCampo(e), best = -1, bd = R * 1.7;
      for (var i = 1; i <= 10; i++) {
        var q = squadraDi(i); if (q !== ui.turno || ui.mie.indexOf(q) < 0) continue;
        var d = Math.hypot(ui.st.x[i] - p.x, ui.st.y[i] - p.y); if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return;
      e.preventDefault(); try { ui.cv.setPointerCapture(e.pointerId); } catch (er) {}
      ui.mira = { i: best, fx: p.x, fy: p.y, id: e.pointerId };
      vibra(8); try { if (window.SG && SG.audioCtx) SG.audioCtx(); } catch (er2) {}
      gira();
    });
    ui.cv.addEventListener("pointermove", function (e) {
      if (!ui.mira || e.pointerId !== ui.mira.id) return;
      var p = alCampo(e); ui.mira.fx = p.x; ui.mira.fy = p.y;
    });
    function lascia(e) {
      var m = ui.mira; if (!m || e.pointerId !== m.id) return;
      ui.mira = null;
      var dx = ui.st.x[m.i] - m.fx, dy = ui.st.y[m.i] - m.fy, len = Math.hypot(dx, dy), p = Math.min(1, len / TIRA);
      if (e.type === "pointerup" && p >= 0.07 && ui.puoi) cb.onTiro(m.i, dx / len * VMAX * p, dy / len * VMAX * p);
      disegna(ui);
    }
    ui.cv.addEventListener("pointerup", lascia);
    ui.cv.addEventListener("pointercancel", lascia);

    // il giro di disegno: gira solo mentre si mira o mentre un tiro corre
    function gira() { if (!ui.raf) ui.raf = requestAnimationFrame(loop); }
    function loop(now) {
      ui.raf = null;
      if (!vivo()) return;
      var A = ui.anim;
      if (A) {
        var dt = A.ult ? Math.min(0.05, (now - A.ult) / 1000) : 0; A.ult = now; A.acc += dt;
        var ev = { urto: 0, muro: 0 }, g = -1, fine = false;
        while (A.acc >= DT) {
          A.acc -= DT; A.passi++; g = passo(A.s, ev);
          if (g >= 0 || fermo(A.s) || A.passi > MAX_SEC / DT) { fine = true; break; }
        }
        if (ev.urto > 0.12) suono("tac", Math.min(1, ev.urto / 4)); else if (ev.muro > 0.35) suono("muro", Math.min(1, ev.muro / 4));
        if (fine) {
          if (g < 0) ferma(A.s);
          ui.anim = null; ui.st = A.s; disegna(ui);
          A.fatto(g, A.s);
          return;
        }
      }
      disegna(ui);
      if (ui.anim || ui.mira) ui.raf = requestAnimationFrame(loop);
    }
    // un tiro: tutti lo rivedono uguale, partendo dalla stessa foto
    ui.anima = function (tiro, fatto) {
      var s0 = daFoto(tiro.st);
      s0.vx[tiro.i] = tiro.vx; s0.vy[tiro.i] = tiro.vy;
      ui.mira = null; ui.anim = { s: s0, acc: 0, passi: 0, fatto: fatto || function () {} };
      gira();
    };
    // aggiorna solo quello che cambia (testi, punti, posizioni da ferme)
    ui.aggiorna = function (d, testi) {
      if (d.st && !ui.anim) ui.st = daFoto(d.st);
      ui.turno = d.turno; ui.fase = d.fase; ui.puoi = !!d.puoi; ui.mie = d.mie || [];
      if (!ui.puoi) ui.mira = null;
      var g = d.gol || [0, 0];
      if (ui.giu.gol.textContent !== String(g[qGiu])) ui.giu.gol.textContent = g[qGiu];
      if (ui.su.gol.textContent !== String(g[1 - qGiu])) ui.su.gol.textContent = g[1 - qGiu];
      ui.testo = testi || { giu: "", su: "" };
      ui.scadenza = d.resto != null ? Date.now() + d.resto * 1000 : null;
      scriviTesti();
      ui.giu.box.classList.toggle("turno", d.fase === "mira" && d.turno === qGiu);
      ui.su.box.classList.toggle("turno", d.fase === "mira" && d.turno === 1 - qGiu);
      if (d.golN && ui.golVisto !== d.golN) { ui.golVisto = d.golN; ui.mostraGol(d.golDi); }
      if (!ui.anim) disegna(ui);
    };
    function scriviTesti() {
      var giu = ui.testo.giu || "", resto = ui.scadenza ? Math.ceil((ui.scadenza - Date.now()) / 1000) : null;
      if (resto != null && resto <= 10 && resto >= 0 && ui.fase === "mira" && ui.puoi) giu += " · " + resto;
      if (ui.giu.msg.textContent !== giu) ui.giu.msg.textContent = giu;
      if (ui.su.msg.textContent !== (ui.testo.su || "")) ui.su.msg.textContent = ui.testo.su || "";
    }
    ui.timer = setInterval(function () { if (!vivo()) { clearInterval(ui.timer); return; } if (ui.scadenza) scriviTesti(); }, 1000);
    ui.mostraGol = function (q) {
      ui.golTxt.textContent = "⚡ GOL! ⚡";
      ui.golTxt.style.color = colore(q);
      ui.golTxt.style.textShadow = "0 4px 0 " + NOTTE + ", 0 0 28px " + colore(q);
      ui.golTxt.classList.remove("su"); void ui.golTxt.offsetWidth; ui.golTxt.classList.add("su");
      suono("gol");
    };
    return ui;
  }

  // il campo, le righe e le porte: disegnati una volta (per ogni misura) su una tela a parte
  function sfondo(ui) {
    var c = document.createElement("canvas"); c.width = ui.cv.width; c.height = ui.cv.height;
    var g = c.getContext("2d"); g.setTransform(ui.dpr, 0, 0, ui.dpr, 0, 0);
    var S = ui.S, ox = ui.ox, oy = ui.oy, B = Math.max(4, 0.022 * S), fw = W * S, fh = L * S, pw = PORTA * S, pd = FONDO * S, px = ox + PL * S;
    var qSu = ui.o.flip ? 0 : 1;   // la squadra che difende la porta in alto (la porta ha il suo colore)
    // bordo luminoso: giallo da una parte, blu dall'altra
    var gb = g.createLinearGradient(0, oy - pd, 0, oy + fh + pd);
    gb.addColorStop(0, colore(qSu)); gb.addColorStop(0.5, "#ffffff"); gb.addColorStop(1, colore(1 - qSu));
    g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 18;
    g.fillStyle = gb; tondoRett(g, ox - B, oy - B, fw + 2 * B, fh + 2 * B, 14); g.fill();
    g.shadowBlur = 0;
    tondoRett(g, px - B, oy - pd - B, pw + 2 * B, pd + B + 4, 8); g.fill();
    tondoRett(g, px - B, oy + fh - 4, pw + 2 * B, pd + B + 4, 8); g.fill();
    rete(g, px, oy - pd, pw, pd, colore(qSu)); rete(g, px, oy + fh, pw, pd, colore(1 - qSu));
    // erba tagliata a scacchi
    g.save(); tondoRett(g, ox, oy, fw, fh, 10); g.clip();
    var nx = 6, ny = 9;
    for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) { g.fillStyle = (i + j) % 2 ? "#3f9e3a" : "#48ab42"; g.fillRect(ox + fw * i / nx, oy + fh * j / ny, fw / nx + 1, fh / ny + 1); }
    // righe bianche
    g.strokeStyle = "rgba(255,255,255,.92)"; g.lineWidth = Math.max(2.5, 0.014 * S);
    g.beginPath(); g.moveTo(ox, oy + fh / 2); g.lineTo(ox + fw, oy + fh / 2); g.stroke();
    g.beginPath(); g.arc(ox + fw / 2, oy + fh / 2, 0.13 * S, 0, Math.PI * 2); g.stroke();
    var aw = 0.56 * S, ad = 0.18 * S;
    tondoRett(g, ox + (fw - aw) / 2, oy - 6, aw, ad + 6, 10); g.stroke();
    tondoRett(g, ox + (fw - aw) / 2, oy + fh - ad, aw, ad + 6, 10); g.stroke();
    g.restore();
    // il fulmine di SPeeD GAME in mezzo al campo
    g.save(); g.globalAlpha = 0.22; fulmine(g, ox + fw / 2, oy + fh / 2, 0.1 * S, "#ffffff"); g.restore();
    ui.bg = c;
  }
  function tondoRett(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function rete(g, x, y, w, h, col) {   // la rete della porta, del colore di chi la difende
    g.fillStyle = NOTTE; g.fillRect(x, y, w, h);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.globalAlpha = 0.55; g.strokeStyle = col; g.lineWidth = 1;
    for (var k = 0; k < w + h; k += 6) { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k, y + h); g.stroke(); }
    for (var k2 = 0; k2 < h; k2 += 6) { g.beginPath(); g.moveTo(x, y + k2); g.lineTo(x + w, y + k2); g.stroke(); }
    g.restore();
  }
  function fulmine(g, x, y, r, col) {   // il fulmine (come nel logo), centrato in x,y, alto 2r
    var P = [[-0.05, -1], [0.5, -1], [0.12, -0.18], [0.48, -0.18], [-0.2, 1], [0.02, 0.12], [-0.45, 0.12]];
    g.fillStyle = col; g.beginPath();
    P.forEach(function (p, k) { var px = x + p[0] * r, py = y + p[1] * r; if (k) g.lineTo(px, py); else g.moveTo(px, py); });
    g.closePath(); g.fill();
  }
  function disegna(ui) {
    var g = ui.ctx; if (!g || !ui.S) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, ui.cv.width, ui.cv.height);
    if (ui.bg) g.drawImage(ui.bg, 0, 0);
    g.setTransform(ui.dpr, 0, 0, ui.dpr, 0, 0);
    var s = ui.anim ? ui.anim.s : ui.st; if (!s) return;
    var S = ui.S, flip = ui.o.flip, i;
    function X(x) { return ui.ox + S * (flip ? W - x : x); }
    function Y(y) { return ui.oy + S * (flip ? L - y : y); }
    // la mira: l'elastico fino al dito e la freccia a puntini (più lunga, più forte)
    var m = ui.mira, pm = 0;
    if (m) {
      var cx = X(s.x[m.i]), cy = Y(s.y[m.i]), qm = squadraDi(m.i);
      var dx = s.x[m.i] - m.fx, dy = s.y[m.i] - m.fy, len = Math.hypot(dx, dy); pm = Math.min(1, len / TIRA);
      var fxs = X(m.fx), fys = Y(m.fy);
      g.strokeStyle = colore(qm); g.globalAlpha = 0.55; g.lineWidth = 3; g.setLineDash([2, 5]);
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(fxs, fys); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      if (len > 0.004) {
        var ux = dx / len, uy = dy / len; if (flip) { ux = -ux; uy = -uy; }
        var lun = (0.3 + 1.0 * pm) * S, k;
        g.fillStyle = "#ffffff";
        for (k = R * S * 1.6; k < lun; k += 11) { g.globalAlpha = 0.95 - 0.7 * k / lun; g.beginPath(); g.arc(cx + ux * k, cy + uy * k, 3.2, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1;
        var ax = cx + ux * lun, ay = cy + uy * lun, nx = -uy, ny = ux, t0 = 10;
        g.fillStyle = colore(qm); g.strokeStyle = NOTTE; g.lineWidth = 2;
        g.beginPath(); g.moveTo(ax + ux * t0, ay + uy * t0); g.lineTo(ax + nx * t0 * 0.8, ay + ny * t0 * 0.8); g.lineTo(ax - nx * t0 * 0.8, ay - ny * t0 * 0.8); g.closePath(); g.fill(); g.stroke();
      }
    }
    // i calciatori: disco del colore della squadra col fulmine
    for (i = 1; i <= 10; i++) {
      var x = X(s.x[i]), y = Y(s.y[i]), r = R * S, q = squadraDi(i);
      g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.arc(x + r * 0.12, y + r * 0.2, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = NOTTE; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      var gd = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 0.86);
      gd.addColorStop(0, "#ffffff"); gd.addColorStop(0.28, colore(q)); gd.addColorStop(1, q === 0 ? "#d99a00" : "#1c4fc4");
      g.fillStyle = gd; g.beginPath(); g.arc(x, y, r * 0.84, 0, Math.PI * 2); g.fill();
      fulmine(g, x, y, r * 0.5, q === 0 ? NOTTE : "#ffffff");
      if (ui.fase === "mira" && q === ui.turno && !ui.anim) {   // chi deve tirare: un anello che gira intorno
        g.strokeStyle = colore(q); g.lineWidth = 2.5; g.setLineDash([5, 4]);
        g.beginPath(); g.arc(x, y, r + 5, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      }
      if (m && m.i === i) {   // la forza: un anello che si riempie (verde, giallo, rosso)
        g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 6;
        g.beginPath(); g.arc(x, y, r + 9, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = "hsl(" + Math.round(120 - 120 * pm) + ",90%,55%)"; g.lineCap = "round";
        g.beginPath(); g.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, pm)); g.stroke(); g.lineCap = "butt";
      }
    }
    // la palla
    var bx = X(s.x[0]), by = Y(s.y[0]), br = RP * S;
    if (!ui.anim) { var al = g.createRadialGradient(bx, by, br, bx, by, br * 2.6); al.addColorStop(0, "rgba(255,240,120,.45)"); al.addColorStop(1, "rgba(255,240,120,0)"); g.fillStyle = al; g.beginPath(); g.arc(bx, by, br * 2.6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.arc(bx + br * 0.2, by + br * 0.28, br, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#151515"; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = "#151515"; g.beginPath();
    for (var k = 0; k < 5; k++) { var a = -Math.PI / 2 + k * 2 * Math.PI / 5; g.lineTo(bx + Math.cos(a) * br * 0.38, by + Math.sin(a) * br * 0.38); }
    g.closePath(); g.fill();
  }

  // =========================================================
  //  CONTRO IL COMPUTER / IN DUE SULLO STESSO TELEFONO
  // =========================================================
  function locale(t, modo) {
    var imp = t.impostazioni || {}, golMax = imp.gol || 3, liv = imp.difficolta || "medio", bot = modo === "bot";
    var g0 = t.giocatori || [];
    var nomi = bot ? [g0[0] || "Tu", "Matt"] : [g0[0] || "Giocatore 1", g0[1] || "Giocatore 2"];
    var omini = [t.mioOmino ? t.mioOmino(nomi[0]) : null, window.SGOmino ? SGOmino.casuale(nomi[1]) : null];
    var primo = 0, P, ui, tm = null, nGol = 0;
    function via() { if (tm) { clearTimeout(tm); tm = null; } }
    var cb = {
      onTiro: function (i, vx, vy) { if (!bot || P.turno === 0) tira(i, vx, vy); },
      onEsci: function () { if (P.fase !== "fine" && !window.confirm("Uscire dalla partita?")) return; via(); t.esci(); }
    };
    function testi() {
      if (P.fase === "gol" || P.fase === "moto") return { giu: "", su: "" };
      if (bot) return P.turno === 0 ? { giu: "Tocca a te! Tira e lascia", su: "" } : { giu: "", su: "Matt pensa…" };
      return P.turno === 0 ? { giu: "Tocca a te! Tira e lascia", su: "" } : { giu: "", su: "Tocca a te! Tira e lascia" };
    }
    function aggiorna() {
      ui.aggiorna({ st: { x: P.s.x, y: P.s.y }, gol: P.gol, turno: P.turno, fase: P.fase, puoi: P.fase === "mira" && (!bot || P.turno === 0),
        mie: bot ? [0] : [0, 1], golN: P.golN, golDi: P.golDi }, testi());
    }
    window.__CB.locale = function () { return P; };   // per le prove
    function inizia() {
      P = { s: nuovoStato(primo), gol: [0, 0], turno: primo, fase: "mira", golN: null, golDi: 0 };
      ui = creaSchermo(t, cb, { flip: false, ruota: !bot, nomi: nomi, omini: omini });
      aggiorna(); prossimo();
    }
    function tira(i, vx, vy) {
      if (P.fase !== "mira" || squadraDi(i) !== P.turno) return;
      P.fase = "moto"; aggiorna();
      ui.anima({ st: { x: P.s.x.slice(), y: P.s.y.slice() }, i: i, vx: vx, vy: vy }, function (g, fin) {
        P.s = { x: fin.x.slice(), y: fin.y.slice(), vx: fin.vx.slice(), vy: fin.vy.slice() };
        if (g >= 0) {
          P.gol[g]++; P.fase = "gol"; P.golN = ++nGol; P.golDi = g; aggiorna();
          tm = setTimeout(function () {
            if (P.gol[g] >= golMax) return fine(g);
            P.s = nuovoStato(1 - g); P.turno = 1 - g; P.fase = "mira"; aggiorna(); prossimo();   // batte chi ha preso gol
          }, 1600);
          return;
        }
        ferma(P.s); P.turno = 1 - P.turno; P.fase = "mira"; aggiorna(); prossimo();
      });
    }
    function prossimo() {
      if (!bot || P.turno !== 1 || P.fase !== "mira") return;
      tm = setTimeout(function () {
        if (P.fase !== "mira" || P.turno !== 1) return;
        var c = sceltaBot(P.s, 1, liv);
        tira(c.i, Math.cos(c.a) * VMAX * c.p, Math.sin(c.a) * VMAX * c.p);
      }, 900);
    }
    function fine(g) {
      via(); P.fase = "fine";
      var cl = [{ nome: nomi[g], pos: 1 }, { nome: nomi[1 - g], pos: 2 }];
      if (t.risultato) t.risultato(cl);
      if (imp.torneo) return t.fine(cl);
      finale(t, { vincitore: g, nomi: nomi, gol: P.gol, mia: bot ? 0 : null }, [
        t.el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: function () { primo = 1 - primo; inizia(); } }),
        t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: t.esci })]);
    }
    inizia();
  }

  // la schermata finale: chi ha vinto e il risultato
  function finale(t, d, tasti, nota) {
    stile();
    var tu = d.mia, vinto = tu != null && d.vincitore === tu;
    var tit = tu == null ? "Ha vinto " + d.nomi[d.vincitore] + "!" : (vinto ? "Hai vinto!" : "Ha vinto " + d.nomi[d.vincitore]);
    var s = t.schermata({ icona: vinto || tu == null ? "🏆" : "⚽", titolo: tit });
    s._contenuto.appendChild(t.el("div", { class: "cb-fine" }, [
      t.el("div", { class: "cb-fine-riga" }, [ t.el("span", { style: "color:" + GIALLO, text: d.nomi[0] }), t.el("b", { html: "<span style='color:" + GIALLO + "'>" + d.gol[0] + "</span> : <span style='color:" + BLU + "'>" + d.gol[1] + "</span>" }), t.el("span", { style: "color:" + BLU, text: d.nomi[1] }) ])
    ]));
    if (nota) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center", text: nota }));
    tasti.forEach(function (b) { if (b) s._piede.appendChild(b); });
    t.mostra(s);
  }

  // =========================================================
  //  ONLINE — HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  var UI = null;   // lo schermo di gioco online si costruisce UNA volta e poi si aggiorna a pezzi
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, golMax: imp.gol || 3, gol: [0, 0], turno: 0, primo: 0, s: nuovoStato(0), stato: "mira", n: 0, golN: null, golDi: 0,
      vincitore: null, ritiro: false, scade: 0, to: null, players: [{ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost) }] };
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function fermaTimer() { if (H.to) { clearTimeout(H.to); H.to = null; } }

    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.golMax = im.gol || 3; bd(); };

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        var p = pById(id); if (!p) return;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
        p.via = true;
        if (H.fase === "gioco") return fine(0, true);   // l'avversario se n'è andato: vince l'host
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (H.fase === "lobby" && !pById(id) && H.players.length < MAX)
            H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino) });
          bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
          return;
        }
        if (H.fase !== "gioco" || !H.players[1] || H.players[1].id !== id) return;
        if (m.t === "tiro") tira(1, m.i | 0, +m.vx || 0, +m.vy || 0);
      }
    });
    function vm() {
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, golMax: H.golMax, gol: H.gol.slice(), turno: H.turno, stato: H.stato, n: H.n,
        resto: H.fase === "gioco" && H.stato === "mira" && H.scade ? Math.max(0, Math.round((H.scade - Date.now()) / 1000)) : null,
        golN: H.golN, golDi: H.golDi, vincitore: H.vincitore, ritiro: H.ritiro,
        st: { x: H.s.x.map(r4), y: H.s.y.map(r4) },
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, via: !!p.via, omino: p.omino || null }; }) };
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); disegnaOnline(t, v, cbHost); }

    function comincia() {
      if (H.fase !== "lobby" || H.players.length < MIN) return;
      H.fase = "gioco"; H.gol = [0, 0]; H.turno = H.primo; H.s = nuovoStato(H.primo); H.vincitore = null; H.ritiro = false; H.golN = null;
      nuovoTurno();
    }
    function nuovoTurno() {
      fermaTimer(); H.stato = "mira"; H.scade = Date.now() + TEMPO * 1000;
      H.to = setTimeout(function () {   // tempo scaduto: tocca all'altro
        if (H.fase !== "gioco" || H.stato !== "mira") return;
        H.turno = 1 - H.turno; nuovoTurno();
      }, TEMPO * 1000);
      bd();
    }
    function tira(q, i, vx, vy) {
      if (H.fase !== "gioco" || H.stato !== "mira" || H.turno !== q || squadraDi(i) !== q) return;
      var v = Math.hypot(vx, vy); if (!(v > 0)) return;
      if (v > VMAX) { vx *= VMAX / v; vy *= VMAX / v; }
      fermaTimer(); H.stato = "moto"; H.n++;
      var tiro = { t: "tiro", n: H.n, i: i, vx: vx, vy: vy, st: { x: H.s.x.slice(), y: H.s.y.slice() } };
      rete.inviaVeloce(tiro);   // tutti rivedono lo stesso tiro
      bd();
      if (UI) UI.anima(tiro, dopoTiro);
      else { var s1 = daFoto(tiro.st); s1.vx[i] = vx; s1.vy[i] = vy; dopoTiro(simula(s1), s1); }
    }
    function dopoTiro(g, fin) {
      H.s = { x: fin.x.slice(), y: fin.y.slice(), vx: fin.vx.slice(), vy: fin.vy.slice() };
      if (g >= 0) {
        H.gol[g]++; H.stato = "gol"; H.golN = H.n; H.golDi = g; bd();
        H.to = setTimeout(function () {
          if (H.gol[g] >= H.golMax) return fine(g);
          H.s = nuovoStato(1 - g); H.turno = 1 - g; nuovoTurno();   // batte chi ha preso gol
        }, 1600);
        return;
      }
      ferma(H.s); H.turno = 1 - H.turno; nuovoTurno();
    }
    function fine(g, ritiro) {
      fermaTimer(); H.fase = "fine"; H.vincitore = g; H.ritiro = !!ritiro; bd();
      var a = H.players[g], b = H.players[1 - g];
      if (t.risultato && a && b) t.risultato([{ nome: a.nome, pos: 1 }, { nome: b.nome, pos: 2 }]);
    }
    // "Nuova partita": stessa stanza, stessi amici, si torna nella saletta (batte l'altro)
    function nuova() { fermaTimer(); H.fase = "lobby"; H.primo = 1 - H.primo; H.players = H.players.filter(function (p) { return !p.via; }); H.gol = [0, 0]; bd(); }

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova,
      onTiro: function (i, vx, vy) { tira(0, i, vx, vy); },
      onEsci: function () {
        if (H.fase === "gioco" && !window.confirm("Chiudere la partita per tutti?")) return;
        fermaTimer(); rete.chiudi(); t.esci();
      } };
    bd();
  }

  // =========================================================
  //  ONLINE — OSPITE: rivede i tiri, disegna le foto dell'host, manda solo i suoi tiri
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null, anim: false, attesa: null, ultimoN: 0 };
    var cb = { sonoHost: false, myId: null,
      onTiro: function (i, vx, vy) { if (S.rete) S.rete.invia({ t: "tiro", i: i, vx: vx, vy: vy }); },
      onEsci: function () {
        if (S.vm && S.vm.fase === "gioco" && !window.confirm("Uscire dalla partita?")) return;
        if (S.rete) S.rete.chiudi(); t.esci();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "⚽", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function applica(v) { S.vm = v; disegnaOnline(t, v, cb); }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;
          if (m.t === "vm") { if (S.anim) S.attesa = m.vm; else applica(m.vm); }
          else if (m.t === "tiro" && m.n > S.ultimoN && UI && S.vm && S.vm.fase === "gioco") {
            S.ultimoN = m.n; S.anim = true;
            UI.anima(m, function () {   // finito il tiro: mi allineo alla foto dell'host
              S.anim = false;
              if (S.attesa) { var v = S.attesa; S.attesa = null; applica(v); }
            });
          }
        },
        onChiuso: function () { errore(t, "La partita è stata chiusa dall'host."); },
        onErrore: function () { errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function attesa() {
      var s = t.schermata({ icona: "⚽", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO ONLINE (host e ospiti): saletta, gioco, fine
  // =========================================================
  function miaSquadra(vm, cb) { for (var k = 0; k < vm.players.length; k++) if (vm.players[k].id === cb.myId) return k; return -1; }
  function disegnaOnline(t, vm, cb) {
    if (vm.fase === "lobby") { UI = null; return lobby(t, vm, cb); }
    var me = miaSquadra(vm, cb), nomi = [(vm.players[0] || {}).nome || "Gialli", (vm.players[1] || {}).nome || "Blu"];
    if (vm.fase === "fine") {
      UI = null;
      var nota = vm.ritiro ? "L'avversario è uscito dalla partita." : (cb.sonoHost ? "" : "Se l'host fa un'altra partita, torni da solo nella saletta.");
      return finale(t, { vincitore: vm.vincitore, nomi: nomi, gol: vm.gol, mia: me >= 0 ? me : null }, [
        cb.sonoHost ? t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }) : null,
        t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci })], nota);
    }
    if (!UI || !document.body.contains(UI.cv))
      UI = creaSchermo(t, cb, { flip: me === 1, ruota: false, nomi: nomi, omini: [(vm.players[0] || {}).omino || null, (vm.players[1] || {}).omino || null] });
    var mio = vm.stato === "mira" && vm.turno === me;
    var testi = vm.stato !== "mira" ? { giu: "", su: "" } : (mio ? { giu: "Tocca a te! Tira e lascia", su: "" } : { giu: "", su: "Sta mirando…" });
    UI.aggiorna({ st: vm.st, gol: vm.gol, turno: vm.turno, fase: vm.stato, puoi: mio, mie: [me], resto: vm.resto, golN: vm.golN, golDi: vm.golDi }, testi);
  }
  function lobby(t, vm, cb) {
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [t.el("p", { class: "modulo-nota", text: "In due: chi apre la stanza ha i gialli, chi entra i blu. Vince chi arriva per primo a " + vm.golMax + " gol." })],
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.cb-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:radial-gradient(120% 75% at 50% 50%,#1c2d6e 0%,#0d1533 72%)}",
      ".schermata.cb-piena>.testa,.schermata.cb-piena>.piede{display:none}",
      ".schermata.cb-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".cb-scena{position:relative;height:var(--alt,100dvh);overflow:hidden;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}",
      ".cb-campo{position:absolute;inset:0;width:100%;height:100%;touch-action:none}",
      // il tasto per uscire: piccolo, nell'angolo (come negli altri giochi)
      ".cb-esci{position:absolute;top:calc(10px + env(safe-area-inset-top));left:10px;z-index:3;width:36px;height:36px;border:0;border-radius:12px;padding:0 0 3px;cursor:pointer;font:inherit;font-size:1.4rem;font-weight:900;line-height:1;color:#fff;background:rgba(255,255,255,.14)}",
      // la targhetta di ognuno: avatar piccolo, nome, messaggio e i suoi gol
      ".cb-targa{position:absolute;left:50%;transform:translateX(-50%);max-width:calc(100% - 112px);display:flex;align-items:center;gap:8px;padding:3px 4px 3px 3px;border-radius:999px;pointer-events:none;",
      "background:rgba(8,13,36,.82);box-shadow:0 0 0 2px rgba(255,255,255,.12);transition:box-shadow .25s}",
      ".cb-targa.giu{bottom:calc(10px + env(safe-area-inset-bottom))}",
      ".cb-targa.su{top:calc(10px + env(safe-area-inset-top))}",
      ".cb-targa.ruota{transform:translateX(-50%) rotate(180deg)}",
      ".cb-targa.turno{box-shadow:0 0 0 2px var(--sq),0 0 16px 2px var(--sq)}",
      ".cb-av{width:30px;height:30px;flex:none;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.18)}",
      ".cb-av svg{width:100%;height:100%;display:block}",
      ".cb-testi{min-width:0;flex:1}",
      ".cb-nome{font-weight:900;font-size:.8rem;line-height:1.15;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cb-msg{font-weight:800;font-size:.68rem;line-height:1.2;color:var(--sq);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cb-msg:empty{display:none}",
      ".cb-golnum{flex:none;min-width:1.5em;padding:0 8px;border-radius:999px;text-align:center;font-weight:900;font-size:1.35rem;line-height:30px;color:#0d1533;background:var(--sq)}",
      ".cb-gol{position:absolute;left:0;right:0;top:50%;margin-top:-.6em;text-align:center;font-weight:900;font-size:clamp(2.6rem,14vw,4.6rem);line-height:1.2;color:#fff;opacity:0;pointer-events:none}",
      ".cb-gol.su{animation:cbGol 1.5s ease}",
      "@keyframes cbGol{0%{opacity:0;transform:scale(.55)}15%{opacity:1;transform:scale(1.1)}30%{transform:scale(1)}80%{opacity:1}100%{opacity:0}}",
      ".cb-fine{text-align:center;margin:18px 0 8px}",
      ".cb-fine-riga{display:flex;align-items:center;justify-content:center;gap:14px;font-weight:900;font-size:1.05rem}",
      ".cb-fine-riga b{font-size:2.6rem;color:#fff}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Calcio Biliardo", icona: "⚽",
    descrizione: "Il calcio coi dischi: tiri indietro un calciatore come una fionda, colpisci la palla e fai gol. Contro Matt, in due sullo stesso telefono o online.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 2,
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Sfidi Matt" },
      { modo: "telefono", icona: "📱", nome: "In due su questo telefono", sotto: "Uno per lato, il telefono in mezzo", amici: true }],
    regole: [
      "Ognuno ha <b>5 calciatori</b>. A turno se ne tira <b>uno</b>: toccalo, tira indietro il dito come una <b>fionda</b> e lascia. Più tiri indietro, più forte parte.",
      "I calciatori colpiscono la palla e gli altri calciatori e <b>rimbalzano sui bordi</b>. Fai entrare la palla nella porta avversaria!",
      "Dopo un gol si riparte dal centro: batte chi ha preso gol. Vince chi arriva per primo ai <b>gol scelti</b>.",
      "Online hai <b>30 secondi</b> per tirare, poi tocca all'altro."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = aiuti.modo || "bot"; dove.gol = 3; dove.difficolta = "medio"; dove.torneo = !!aiuti.torneo;
      if (aiuti.torneo) { dove.modo = "telefono"; return; }
      function chips(etichetta, scelte, chiave, val) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:8px", text: etichetta }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(" + scelte.length + ",1fr)" });
        scelte.forEach(function (c) {
          var b = el("button", { class: "modo-chip" + (c[0] === val ? " attiva" : ""), style: "justify-content:center", onclick: function () {
            dove[chiave] = c[0]; [].forEach.call(g.children, function (x) { x.className = "modo-chip"; }); b.className = "modo-chip attiva";
          } }, [el("div", { class: "mt", text: c[1] })]);
          g.appendChild(b);
        });
        box.appendChild(g);
      }
      chips("Si gioca fino a", [[1, "1 gol"], [3, "3 gol"], [5, "5 gol"]], "gol", 3);
      if (dove.modo === "bot") chips("Bravura di Matt", [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]], "difficolta", "medio");
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      var m = (t.impostazioni || {}).modo;
      if (m === "online") return host(t);
      return locale(t, m === "telefono" ? "telefono" : "bot");
    }
  });

  // per le prove: la fisica e Matt, senza disegno
  window.__CB = { nuovoStato: nuovoStato, simula: simula, sceltaBot: sceltaBot, copia: copia, passo: passo, fermo: fermo, VMAX: VMAX };
})();
