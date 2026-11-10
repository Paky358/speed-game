// Simulazione de «Il Muro»: decide valori delle caselle, palline, domande, cronometro.
// Uso: node sim-muro.js [muri|giro|stima|strategie|rimonta|tempo|punti|tutto] [partite]
"use strict";
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry(12345);
function gauss() { var u = 0, v; while (!u) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

// ---------- i muri ----------
// posizioni a mezza casella: p = 0..2*(C-1); la pallina parte da p=2*x e a ogni fila va di +-1, rimbalzando sulle pareti (come il Plinko del Prezzo)
var MURI = {
  A: { nome: "A: 9 caselle, 9 zone, 12 file", C: 9, righe: 12, zone: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  B: { nome: "B: 13 caselle, 7 zone, 16 file", C: 13, righe: 16, zone: [0, 2, 4, 6, 8, 10, 12] }
};
function distribuzione(m, x) {
  var P = 2 * (m.C - 1), d = new Array(P + 1).fill(0); d[2 * x] = 1;
  for (var r = 0; r < m.righe; r++) {
    var n = new Array(P + 1).fill(0);
    for (var p = 0; p <= P; p++) if (d[p]) {
      [-1, 1].forEach(function (s) { var q = p + s; if (q < 0) q = 1; if (q > P) q = P - 1; n[q] += d[p] / 2; });
    }
    d = n;
  }
  var c = new Array(m.C).fill(0);
  for (var p2 = 0; p2 <= P; p2 += 2) c[p2 / 2] += d[p2];
  return c;
}
// profili dei valori (simmetrici). Il segno cambia col muro: + vincitori, - perdenti.
var PROFILI = {
  A: {
    "cupola": [50, 100, 250, 500, 1000, 500, 250, 100, 50],
    "conca": [1000, 500, 250, 100, 50, 100, 250, 500, 1000],
    "mista": [500, 1000, 100, 250, 0, 250, 100, 1000, 500],
    "cupola-forte": [0, 100, 250, 500, 2000, 500, 250, 100, 0]
  },
  B: {
    "cupola": [50, 100, 150, 250, 500, 1000, 2000, 1000, 500, 250, 150, 100, 50],
    "conca": [2000, 1000, 500, 250, 150, 100, 50, 100, 150, 250, 500, 1000, 2000],
    "mista": [1000, 250, 100, 500, 50, 250, 0, 250, 50, 500, 100, 250, 1000],
    "cupola-larga": [100, 100, 250, 250, 500, 1000, 1000, 1000, 500, 250, 250, 100, 100]
  }
};
function preparaMuro(w, prof) {
  var m = MURI[w], v = PROFILI[w][prof], o = { id: w, C: m.C, righe: m.righe, zone: m.zone, v: v, prof: prof, Z: [] };
  m.zone.forEach(function (x) {
    var d = distribuzione(m, x), mean = 0, sq2 = 0, cum = [], a = 0;
    d.forEach(function (p, c) { mean += p * v[c]; sq2 += p * v[c] * v[c]; a += p; cum.push(a); });
    o.Z.push({ x: x, mean: mean, sd: Math.sqrt(Math.max(0, sq2 - mean * mean)), cum: cum, d: d });
  });
  var mn = o.Z.map(function (z) { return z.mean; }), sd = o.Z.map(function (z) { return z.sd; });
  o.MZ = Math.max.apply(null, mn);
  o.zBest = mn.indexOf(o.MZ);
  o.zRisk = sd.indexOf(Math.max.apply(null, sd));
  o.zLow = mn.indexOf(Math.min.apply(null, mn));
  return o;
}
function lancia(muro, zi) { var z = muro.Z[zi], r = rnd(), i = 0; while (z.cum[i] < r && i < z.cum.length - 1) i++; return muro.v[i]; }

// ---------- giocatori ----------
var ARGOMENTI = 12;
// quanto sanno gli amici: sapere = probabilita' media di CONOSCERE la risposta (se non la sa tira a indovinare); topic = quanto cambia da un argomento all'altro; dq = quanto cambia la difficolta' da domanda a domanda
var MOD = { base: 0.30, topic: 0.20, dq: 0.15, p3: 0.65, diff: 0.08 };
if (process.env.MODELLO) Object.assign(MOD, JSON.parse(process.env.MODELLO));
function nuovaSquadra(opz) { // {taglia, sapere (media), sigma (errore di chi sta giu' sul compagno), strat}
  var t = { taglia: opz.taglia, strat: opz.strat, punti: 0, giuste: 0, atteso: 0, fortuna: 0, membri: [] };
  for (var i = 0; i < t.taglia; i++) {
    var a = clamp(opz.sapere + gauss() * 0.06, 0.15, 0.9), top = [];
    for (var k = 0; k < ARGOMENTI; k++) top.push(clamp(a + gauss() * MOD.topic, 0.03, 0.97));
    t.membri.push({ top: top, bias: [] });
  }
  // l'errore di chi sta giu' su ognuno dei compagni, per argomento, dura tutta la partita
  for (var g = 0; g < t.taglia; g++) {
    t.membri[g].bias = t.membri.map(function () { var b = []; for (var k2 = 0; k2 < ARGOMENTI; k2++) b.push(gauss() * opz.sigma); return b; });
  }
  return t;
}

// ---------- strategie di chi sta giu' ----------
function scegli(strat, q, cx) {
  var M = cx.muro, MAX = cx.MAX, minB = cx.minB, n = 0, zi = M.zBest;
  if (strat === "furbo") {
    var k = cx.k, thr = k / (1 + k) + 0.03, hi = thr + 0.12, rischia = false, cauto = false;
    if (cx.ultimo) {
      var swing = MAX * M.MZ * cx.mult * 0.55;
      if (cx.divario > 0.5 * swing * cx.restano) rischia = true;
      else if (-cx.divario > 1.6 * swing * cx.restano) cauto = true;
    } else if (cx.divario > 4.5 * MAX * M.MZ * 0.55) { thr -= 0.03; hi -= 0.03; }
    if (rischia) { n = MAX; zi = q > 0.5 ? M.zBest : M.zRisk; }
    else {
      var f = clamp((q - thr) / (hi - thr), 0, 1);
      n = f > 0 ? Math.max(1, Math.round(f * MAX)) : 0;
      if (cauto) n = q > 0.8 ? 1 : 0;
    }
  } else if (strat === "tutto") { n = MAX; }
  else if (strat === "prudente") { n = q > 0.62 ? Math.max(1, Math.round(MAX / 3)) : 0; }
  else if (strat === "caso") { n = Math.floor(rnd() * (MAX + 1)); zi = Math.floor(rnd() * M.Z.length); }
  if (n < minB) { n = minB; zi = M.zLow; if (strat === "caso") zi = Math.floor(rnd() * M.Z.length); if (strat === "tutto") zi = M.zBest; }
  return { n: n, zi: zi };
}

// ---------- una partita ----------
// cfg: muro, MAX, Qn (domande normali), Qf (domande dell'ultimo giro), mult (ultimo giro), zero (punti fermi a 0), minB, squadre[]
function partita(cfg) {
  var M = cfg.muro, T = cfg.squadre.map(nuovaSquadra), Q = cfg.Qn + cfg.Qf, hist = [], prima = null;
  for (var k = 0; k < Q; k++) {
    var ultimo = k >= cfg.Qn, mult = ultimo ? cfg.mult : 1, top = Math.floor(rnd() * ARGOMENTI), nop = rnd() < MOD.p3 ? 3 : 2, dq = gauss() * MOD.dq;
    var guess = nop === 2 ? 0.5 : (rnd() < 0.3 ? 0.5 : 1 / 3); // con 3 risposte a volte se ne scarta una
    var lead = Math.max.apply(null, T.map(function (t) { return t.punti; }));
    var esiti = T.map(function (t) {
      var giu = k % t.taglia, best = -1, qb = -1, vero = 0;
      for (var i = 0; i < t.taglia; i++) {
        if (i === giu) continue;
        var v = clamp(t.membri[i].top[top] + dq, 0.02, 0.98);
        var st = clamp(t.membri[i].top[top] + t.membri[giu].bias[i][top] + 0.5 * (dq + gauss() * 0.10), 0.02, 0.98);
        var qs = st + (1 - st) * guess;
        if (qs > qb) { qb = qs; best = i; vero = v; }
      }
      var pc = vero + (1 - vero) * guess, ok = rnd() < pc;
      t.atteso += pc; if (ok) t.giuste++;
      var sc = scegli(t.strat, qb, { muro: M, MAX: cfg.MAX, minB: cfg.minB, k: cfg.k, ultimo: ultimo, mult: mult, divario: lead - t.punti, restano: Q - k });
      return { ok: ok, n: sc.n, zi: sc.zi };
    });
    var nPer = 0, nVin = 0;
    // prima il muro dei perdenti, poi quello dei vincitori
    [false, true].forEach(function (vincono) {
      esiti.forEach(function (e, ti) {
        if (e.ok !== vincono) return;
        var t = T[ti], tot = 0, att = 0;
        for (var b = 0; b < e.n; b++) { tot += lancia(M, e.zi); att += M.Z[e.zi].mean; }
        tot *= mult; att *= mult;
        if (!vincono) { tot *= cfg.k; att *= cfg.k; var nuovo = t.punti - tot; if (cfg.zero && nuovo < 0) nuovo = 0; t.fortuna -= tot - att; t.punti = nuovo; nPer += e.n; }
        else { t.punti += tot; t.fortuna += tot - att; nVin += e.n; }
      });
    });
    hist.push({ nPer: nPer, nVin: nVin });
    if (k === cfg.Qn - 1) prima = T.map(function (t) { return t.punti; });
  }
  return { T: T, hist: hist, primaFinale: prima };
}
function vincitore(punti) { var m = Math.max.apply(null, punti), c = []; punti.forEach(function (p, i) { if (p === m) c.push(i); }); return c[Math.floor(rnd() * c.length)]; }
function perc(x) { return (100 * x).toFixed(0) + "%"; }
function pct(a, p) { var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(p * (s.length - 1))]; }
function punto(n) { var s = String(Math.round(n)), neg = s[0] === "-"; if (neg) s = s.slice(1); return (neg ? "-" : "") + s.replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function argmax(arr, f) { var b = 0; arr.forEach(function (x, i) { if (f(x, i) > f(arr[b], b)) b = i; }); return b; }

// ---------- tempo (secondi) ----------
function tempo(cfg, hist, nSq) {
  var tot = 12; // introduzione
  hist.forEach(function (h, k) {
    var dom = 0.72 * cfg.cron + 3; // di solito si chiude prima, quando tutti hanno risposto
    var sv = 4 + 0.7 * nSq;       // rullo, domanda, risposta giusta, cosa ha detto ogni squadra
    var muro = function (n) { return n === 0 ? 0.8 : 2 + 0.17 * cfg.muro.righe + 0.09 * Math.min(n, 30) + 1.6; };
    tot += dom + sv + muro(h.nPer) + muro(h.nVin) + 3.2;
    if (k === cfg.Qn - 1) tot += 8; // cartello dell'ultimo giro doppio
  });
  return tot + 20; // podio
}

// ---------- una serie di partite ----------
// fabbrica(): ritorna l'elenco delle squadre di una partita
function serie(cfg, N, fabbrica) {
  var r = { N: N, vinceSapere: 0, vincePiuGiuste: 0, inVetta: 0, punti: [], vit: [], secondi: [], sotto0: 0, nvit: 0, finalePesa: 0, fortunaNum: 0, fortunaDen: 0, sumX: 0, sumX2: 0, nn: 0, ultima: 0 };
  for (var g = 0; g < N; g++) {
    cfg.squadre = fabbrica(g);
    var P = partita(cfg), fin = P.T.map(function (t) { return t.punti; }), w = vincitore(fin);
    var sap = argmax(P.T, function (t) { return t.atteso + rnd() * 1e-9; });
    var gi = argmax(P.T, function (t) { return t.giuste + rnd() * 1e-6; });
    if (w === sap) r.vinceSapere++;
    if (w === gi) r.vincePiuGiuste++;
    var lead = vincitore(P.primaFinale);
    if (w === lead) r.inVetta++;
    var ult = argmax(P.primaFinale, function (p) { return -p + rnd() * 1e-9; });
    if (w === ult) r.ultima++;
    r.punti.push(fin[w]);
    P.T.forEach(function (t, i) {
      r.vit.push(t.punti); if (t.punti < 0) r.sotto0++; r.nvit++;
      r.fortunaNum += t.fortuna * t.fortuna; r.sumX += t.punti; r.sumX2 += t.punti * t.punti; r.nn++;
    });
    var dF = 0, dP = 0; fin.forEach(function (p, i) { dF += Math.abs(p - P.primaFinale[i]); dP += Math.abs(P.primaFinale[i]); });
    r.finalePesa += dF / Math.max(1, dF + dP);
    r.secondi.push(tempo(cfg, P.hist, P.T.length));
  }
  var mean = r.sumX / r.nn, varT = r.sumX2 / r.nn - mean * mean;
  r.fortuna = (r.fortunaNum / r.nn) / varT; r.finalePesa /= N;
  return r;
}
function sqVari(n, sigma, strat) { // squadre di bravura diversa: la differenza e' quella che vogliamo riconoscere
  var a = []; for (var i = 0; i < n; i++) a.push({ taglia: 2, sapere: clamp(MOD.base + gauss() * MOD.diff, 0.12, 0.7), sigma: sigma, strat: strat || "furbo" }); return a;
}
function riga(etichetta, r) {
  return etichetta + " | sa di più vince " + perc(r.vinceSapere / r.N) + " (con più risposte giuste " + perc(r.vincePiuGiuste / r.N) + ")" + " | fortuna palline " + perc(r.fortuna) + " | ultimo giro pesa " + perc(r.finalePesa) +
    " | 1° prima del giro doppio vince " + perc(r.inVetta / r.N) + ", l'ultima " + perc(r.ultima / r.N) + " | vincitore " + punto(pct(r.punti, 0.5)) +
    " (" + punto(pct(r.punti, 0.1)) + "…" + punto(pct(r.punti, 0.9)) + ") | " + (pct(r.secondi, 0.5) / 60).toFixed(1) + " min";
}
function cfgBase(w, prof, o) { return Object.assign({ muro: preparaMuro(w, prof), MAX: 3, Qn: 12, Qf: 3, mult: 2, k: 1, zero: false, minB: 0, cron: 20, squadre: null }, o || {}); }
function tre(sigma) { return function () { return sqVari(3, sigma); }; }

// ---------- rapporti ----------
function rapMuri() {
  console.log("\n== I MURI: una pallina per zona (valore medio, oscillazione, probabilità di finire sulle due caselle di bordo) ==");
  ["A", "B"].forEach(function (w) {
    Object.keys(PROFILI[w]).forEach(function (pr) {
      var M = preparaMuro(w, pr);
      console.log("\nMuro " + MURI[w].nome + " | profilo «" + pr + "»: " + M.v.map(punto).join(" "));
      M.Z.forEach(function (z, i) { console.log("  zona " + (i + 1) + " (sopra la casella " + (z.x + 1) + "): media " + punto(z.mean) + ", oscilla di " + punto(z.sd) + ", bordo " + perc(z.d[0] + z.d[M.C - 1])); });
    });
  });
}
function rapGiro(N) {
  console.log("\n== CONFRONTO MURI E VALORI (3 squadre da 2, bravure diverse, furbo, 12+3 domande, MAX 3, ultimo ×2, 0 palline sì) ==");
  ["A", "B"].forEach(function (w) {
    Object.keys(PROFILI[w]).forEach(function (pr) {
      console.log(riga(w + " " + pr + " ".repeat(Math.max(1, 13 - pr.length)), serie(cfgBase(w, pr), N, tre(0.10))));
    });
  });
}
function rapMAX(N) {
  console.log("\n== QUANTE PALLINE AL MASSIMO ==");
  [["A", "cupola"], ["B", "cupola"], ["A", "conca"], ["B", "conca"]].forEach(function (wp) {
    [2, 3, 4, 5].forEach(function (mx) {
      console.log(riga(wp[0] + " " + wp[1] + " MAX " + mx + " ", serie(cfgBase(wp[0], wp[1], { MAX: mx }), N, tre(0.10))));
    });
  });
}
function rapGiri(N) {
  console.log("\n== QUANTE DOMANDE E COME SONO DIVISE (A cupola, MAX 3, ultimo ×2) ==");
  [[9, 3], [12, 3], [12, 2], [10, 4], [14, 4], [15, 3], [8, 4], [12, 6]].forEach(function (c) {
    console.log(riga(c[0] + "+" + c[1] + " domande ", serie(cfgBase("A", "cupola", { Qn: c[0], Qf: c[1] }), N, tre(0.10))));
  });
  console.log("  moltiplicatore dell'ultimo giro (12+3):");
  [3, 1].forEach(function (m) { console.log(riga("×" + m + " ultimo giro ", serie(cfgBase("A", "cupola", { mult: m }), N, tre(0.10)))); });
}
function rapRegole(N) {
  console.log("\n== PUNTI FERMI A ZERO O SOTTO ZERO, 0 PALLINE O ALMENO 1 (A cupola, MAX 3) ==");
  [false, true].forEach(function (z) { [0, 1].forEach(function (mb) {
    var r = serie(cfgBase("A", "cupola", { zero: z, minB: mb }), N, tre(0.10));
    console.log(riga((z ? "ferme a 0 " : "sotto zero") + " minimo " + mb + " ", r) + " | squadre sotto zero a fine " + perc(r.sotto0 / r.nvit));
  }); });
}
function rapStima(N) {
  console.log("\n== CONTA CONOSCERE L'AMICO? Squadre ugualmente brave, la prima stima bene, le altre male; tutte furbe ==");
  [["A", "cupola"], ["B", "cupola"]].forEach(function (wp) {
    [[0.05, 0.30], [0.05, 0.15], [0.10, 0.30], [0.05, 0.05]].forEach(function (er) {
      [2, 3, 4].forEach(function (ns) {
        var v = 0, pb = 0, pm = 0, cfg = cfgBase(wp[0], wp[1]);
        for (var g = 0; g < N; g++) {
          cfg.squadre = []; for (var i = 0; i < ns; i++) cfg.squadre.push({ taglia: 2, sapere: MOD.base, sigma: i === 0 ? er[0] : er[1], strat: "furbo" });
          var P = partita(cfg), fin = P.T.map(function (t) { return t.punti; });
          if (vincitore(fin) === 0) v++; pb += fin[0]; pm += (fin[1] || 0);
        }
        console.log(wp[0] + " errore " + er[0] + " contro " + er[1] + ", " + ns + " squadre: chi stima bene vince " + perc(v / N) + " (a pari sarebbe " + perc(1 / ns) + ") | punti medi " + punto(pb / N) + " contro " + punto(pm / N));
      });
    });
  });
}
function rapStrategie(N) {
  console.log("\n== «SEMPRE TUTTO» E ALTRE STRATEGIE CONTRO DUE «FURBO» (stesso sapere, errore 0,10) ==");
  [["A", "cupola"], ["B", "cupola"], ["A", "conca"]].forEach(function (wp) {
    ["tutto", "prudente", "caso"].forEach(function (s) {
      [{ zero: false, minB: 0 }, { zero: true, minB: 0 }, { zero: false, minB: 1 }].forEach(function (rg) {
        var cfg = cfgBase(wp[0], wp[1], rg), v = 0, p0 = 0, p1 = 0;
        for (var g = 0; g < N; g++) {
          cfg.squadre = [{ taglia: 2, sapere: MOD.base, sigma: 0.10, strat: s }, { taglia: 2, sapere: MOD.base, sigma: 0.10, strat: "furbo" }, { taglia: 2, sapere: MOD.base, sigma: 0.10, strat: "furbo" }];
          var P = partita(cfg), fin = P.T.map(function (t) { return t.punti; }); if (vincitore(fin) === 0) v++; p0 += fin[0]; p1 += (fin[1] + fin[2]) / 2;
        }
        console.log(wp[0] + " " + wp[1] + " " + (rg.zero ? "ferme a 0 " : "sotto zero") + " minimo " + rg.minB + " | " + s + " contro 2 furbo: vince " + perc(v / N) + " (pari 33%) | punti medi " + punto(p0 / N) + " contro " + punto(p1 / N));
      });
    });
  });
  console.log("\n  Una squadra che sa di più (+0,08) ma gioca «tutto», contro due furbo:");
  [["A", "cupola"], ["B", "cupola"]].forEach(function (wp) {
    var cfg = cfgBase(wp[0], wp[1]), v = 0, v2 = 0;
    for (var g = 0; g < N; g++) {
      [["tutto", 0], ["furbo", 1]].forEach(function (s) {
        cfg.squadre = [{ taglia: 2, sapere: MOD.base + 0.08, sigma: 0.10, strat: s[0] }, { taglia: 2, sapere: MOD.base, sigma: 0.10, strat: "furbo" }, { taglia: 2, sapere: MOD.base, sigma: 0.10, strat: "furbo" }];
        var P = partita(cfg); if (vincitore(P.T.map(function (t) { return t.punti; })) === 0) { if (s[1]) v2++; else v++; }
      });
    }
    console.log("  " + wp[0] + ": se gioca «tutto» vince " + perc(v / N) + ", se gioca «furbo» vince " + perc(v2 / N));
  });
}
function rapRimonta(N) {
  console.log("\n== RIMONTA NELL'ULTIMO GIRO DOPPIO (3 squadre da 2, stesso sapere) ==");
  [["A", "cupola", 12, 3], ["A", "cupola", 12, 2], ["A", "cupola", 10, 4], ["B", "cupola", 12, 3], ["A", "conca", 12, 3]].forEach(function (c) {
    var cfg = cfgBase(c[0], c[1], { Qn: c[2], Qf: c[3] }), cnt = [0, 0, 0], tot = [0, 0, 0], scala = cfg.MAX * cfg.muro.MZ * 0.5, rim = 0;
    for (var g = 0; g < N; g++) {
      cfg.squadre = [0, 1, 2].map(function () { return { taglia: 2, sapere: MOD.base, sigma: 0.10, strat: "furbo" }; });
      var P = partita(cfg), fin = P.T.map(function (t) { return t.punti; }), w = vincitore(fin), pf = P.primaFinale;
      var lead = argmax(pf, function (p) { return p + rnd() * 1e-9; });
      var ord = pf.slice().sort(function (a, b) { return b - a; });
      // distanza della seconda dalla prima in "domande tipiche"
      var k = (ord[0] - ord[2]) / scala, cl = k < 2 ? 0 : k < 6 ? 1 : 2;
      tot[cl]++; if (w !== lead) { cnt[cl]++; rim++; }
    }
    console.log(c[0] + " " + c[1] + " " + c[2] + "+" + c[3] + ": vince chi non era primo " + perc(rim / N) + " | se il divario tra 1ª e ultima era piccolo (<2 domande) " + perc(cnt[0] / Math.max(1, tot[0])) + ", medio (2-6) " + perc(cnt[1] / Math.max(1, tot[1])) + ", grande (>6) " + perc(cnt[2] / Math.max(1, tot[2])) + "  [partite: " + tot.join("/") + "]");
  });
}
function rapTempo(N) {
  console.log("\n== DURATA IN MINUTI (A cupola, MAX 3) ==");
  [[8, 3], [10, 3], [12, 3], [14, 3], [15, 3]].forEach(function (c) {
    [15, 20, 25].forEach(function (cr) {
      var s = [2, 4, 5].map(function (ns) {
        var r = serie(cfgBase("A", "cupola", { Qn: c[0], Qf: c[1], cron: cr }), Math.min(N, 400), function () { return sqVari(ns, 0.10); });
        return ns + " squadre " + (pct(r.secondi, 0.5) / 60).toFixed(1);
      });
      console.log(c[0] + "+" + c[1] + " domande, cronometro " + cr + " s: " + s.join(" | "));
    });
  });
  var rb = serie(cfgBase("B", "cupola", { cron: 20 }), 300, tre(0.10));
  console.log("muro B (16 file) 12+3, cronometro 20 s, 3 squadre: " + (pct(rb.secondi, 0.5) / 60).toFixed(1) + " min");
}
function rapPunti(N) {
  console.log("\n== QUANTI PUNTI SI FANNO (3 squadre da 2, 12+3 domande, MAX 3) ==");
  [["A", "cupola"], ["A", "conca"], ["B", "cupola"], ["B", "conca"]].forEach(function (wp) {
    var r = serie(cfgBase(wp[0], wp[1]), N, tre(0.10));
    console.log(wp[0] + " " + wp[1] + ": tutte le squadre a fine partita 10°=" + punto(pct(r.vit, 0.1)) + " mediana=" + punto(pct(r.vit, 0.5)) + " 90°=" + punto(pct(r.vit, 0.9)) + "; vincitore mediano " + punto(pct(r.punti, 0.5)));
  });
}
var arg = process.argv[2] || "tutto", N = parseInt(process.argv[3] || "3000", 10);
if (arg === "muri" || arg === "tutto") rapMuri();
if (arg === "giro" || arg === "tutto") { rapGiro(N); rapMAX(N); rapGiri(N); rapRegole(N); }
if (arg === "stima" || arg === "tutto") rapStima(N);
if (arg === "strategie" || arg === "tutto") rapStrategie(N);
if (arg === "rimonta" || arg === "tutto") rapRimonta(N);
if (arg === "tempo" || arg === "tutto") rapTempo(N);
if (arg === "punti" || arg === "tutto") rapPunti(N);

// ---------- la leva che rende la scommessa un rischio vero ----------
function rapLeva(N) {
  console.log("\n== LA SCOMMESSA E' UN RISCHIO VERO? (muro A cupola, 3 squadre da 2 con lo stesso sapere) ==");
  console.log("   k = quanto pesa perdere rispetto a vincere (1 = uguale, come nel programma; 1,5 = una pallina sbagliata toglie il 50% in più)");
  [0.20, 0.30, 0.45].forEach(function (base) {
    [1, 1.25, 1.5, 2].forEach(function (k) {
      var cfg = cfgBase("A", "cupola", { k: k }), vt = 0, vb = 0, vm = 0, pt = 0, pf = 0, acc = 0, nq = 0;
      Object.assign(MOD, { base: base });
      for (var g = 0; g < N; g++) {
        cfg.squadre = [{ taglia: 2, sapere: base, sigma: 0.10, strat: "tutto" }, { taglia: 2, sapere: base, sigma: 0.10, strat: "furbo" }, { taglia: 2, sapere: base, sigma: 0.10, strat: "furbo" }];
        var P = partita(cfg), fin = P.T.map(function (t) { return t.punti; }); if (vincitore(fin) === 0) vt++; pt += fin[0]; pf += (fin[1] + fin[2]) / 2;
        acc += P.T[1].giuste + P.T[2].giuste; nq += 2 * (cfg.Qn + cfg.Qf);
        cfg.squadre = [{ taglia: 2, sapere: base, sigma: 0.05, strat: "furbo" }, { taglia: 2, sapere: base, sigma: 0.30, strat: "furbo" }, { taglia: 2, sapere: base, sigma: 0.30, strat: "furbo" }];
        P = partita(cfg); if (vincitore(P.T.map(function (t) { return t.punti; })) === 0) vb++;
        cfg.squadre = [{ taglia: 2, sapere: base, sigma: 0.05, strat: "furbo" }, { taglia: 2, sapere: base, sigma: 0.05, strat: "furbo" }, { taglia: 2, sapere: base, sigma: 0.05, strat: "furbo" }]; // controllo
        P = partita(cfg); if (vincitore(P.T.map(function (t) { return t.punti; })) === 0) vm++;
      }
      console.log("sapere " + base.toFixed(2) + " (risposte giuste " + perc(acc / nq) + "), k " + k + ": «tutto» vince " + perc(vt / N) + " contro 2 furbo (punti " + punto(pt / N) + " contro " + punto(pf / N) + ") | chi stima bene (0,05) contro due che stimano male (0,30) vince " + perc(vb / N) + " (pari 33%; controllo tutti uguali " + perc(vm / N) + ")");
    });
  });
  Object.assign(MOD, { base: 0.30 });
}
if (arg === "leva" || arg === "tutto") rapLeva(N);
